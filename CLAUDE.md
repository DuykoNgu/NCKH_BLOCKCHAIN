# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

EduChain: a custom permissioned (PoA, round-robin) blockchain for issuing and verifying university degrees as NFTs. MOET (Bộ GD&ĐT) acts as super validator; universities run validator/observer nodes. Design diagrams (Vietnamese) live in `SystemEduChain.md`. UI text and many comments are in Vietnamese.

- `back_end/` — Python **Flask** node (the `back_end/README.md` structure tree describing FastAPI/`api/` is outdated; trust the code).
- `front_end/` — React 18 + TypeScript + Vite (rolldown-vite) + Tailwind + shadcn/ui.

## Commands

Backend (run from `back_end/`, after `python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`):

```bash
python run.py                   # node configured by back_end/.env (NODE_NAME/NODE_ROLE/NODE_IP/NODE_PORT/NODE_PASSPHRASE/SEED_NODES)
python run.py --env .env.other  # another node on the same machine (different NODE_NAME/NODE_PORT)
python run.py --no-network      # skip P2P init/sync/daemon
python tests/check_authority.py # assert-based consensus/authority check (no running node needed)
docker compose up --build       # (repo root) 3-node network: moet :5001, truong-a :5002, truong-b :5003
```

There are no CLI flags for port/db/validator index — every node runs the same command; per-node settings come only from env (`app/core/config.py`), network-wide settings only from `network/config.json` (must be identical on all nodes).

`back_end/tests/quick_test.py` is a load script that hits a running node at `http://127.0.0.1:5000` (not a pytest suite). Note `.gitignore` ignores `test_*.py` everywhere, so new test files named that way won't be committed.

Frontend (from `front_end/`): `npm run dev` (port 5173), `npm run build` (`tsc -b && vite build`), `npm run lint`. API base URL comes from `VITE_API_URL` (should end in `/api/v1`).

## Backend architecture

Layering: `app/controllers/v1/*Controller.py` (Flask blueprints, all prefixed `/api/v1/<area>`) → `app/services/` → `app/repositories/` (raw `sqlite3`, no ORM) → `app/models/` (plain classes with `to_dict`). Blueprints are registered in `app/main.py::create_app`. Packages have no `__init__.py` (implicit namespace packages) — import modules by full path, e.g. `from app.database.connection import get_connection`.

Key cross-cutting pieces:
- **Node config & data**: `app/core/config.py` reads env (`run.py --env` loads the file before any `app.*` import). All node state lives in `DATA_DIR` (default `back_end/data/<NODE_NAME>/`): `node.db`, `node.keystore`, `moet_admin.key`. `app.database.database.DB_PATH` derives from it.
- **SQLite concurrency**: many threads (Flask, validator worker, network daemon, chain monitor) share one DB file. Writes must go through `acquire_write_lock()`/`release_write_lock()` in `app/database/connection.py`, and connections should be closed promptly. Pass an existing `conn` to repository calls inside a locked section (e.g. `TransactionRepository.create_transaction(tx, conn=conn)`) to avoid self-deadlock.
- **In-memory chain singleton**: `app/blockchain_instance.py` holds the global `BlockChain` (chain list + `mempool` + `authority_set`). On restart it reloads the full chain from DB; DB (`get_local_db_height`) is the source of truth for height. Genesis: only the `NODE_ROLE=moet` node creates it; other nodes retry fetching `/api/v1/block/genesis` from seeds until MOET is up. `super_validator_pubkey` = genesis validator (optionally pinned by `moet_public_key` in config).
- **Consensus**: `consensus/validator_worker.py` — round-robin slots (`slot_duration` 5s) via `network/ntp_sync.ConsensusTimer`. The schedule is derived, not configured: `sorted(blockchain.authority_set)`, recomputed each loop. `authority_set` = MOET genesis key + keys from `validator_add` txs signed by MOET (`BlockChainService.is_signed_by_moet`, rebuilt from chain on boot by `rebuild_authority_set`). `is_valid_new_block` rejects blocks from keys outside the set. Flow: validator activates → self-signed `validator_activate` tx → when MOET executes it, `maybe_auto_approve_validator` emits `validator_add` (policy: `whitelist` in config). Before mining, a validator queries heights of all known peers and skips its slot if it can't catch up (there is no fork-choice/rollback).
- **Bootstrapping** (`app/core/node_bootstrap.py`, called from `run.py`): creates `node.keystore` if missing, unlocks it with `NODE_PASSPHRASE` or a getpass prompt (TTY only; Enter → observer), auto-activates the validator. On the MOET node, `ensure_moet_admin` registers the single `moet` account on-chain (`account_register` with role `moet` is only valid when signed by MOET; the REST register endpoint refuses role `moet`). `submit_system_tx` signs + mempools + persists + broadcasts a node-signed tx. Runtime toggle: `/api/v1/auth/activate` / `deactivate`.
- **Node monitor**: `GET /api/v1/monitor/network` (MonitorController) fans out to every known peer's `GET /monitor/node` and returns nodes + authority set + pending validators + slot leader; UI is `/admin/network` (topology tree). `POST /monitor/validators/approve|remove` emit MOET-signed `validator_add|validator_remove` and only work on the active MOET node; they're guarded by `app/core/auth.require_role('moet')` (JWT bearer) — the only JWT-protected endpoints so far. A removed key is put in `revoked_validators` and is never auto-approved again.
- **P2P** (`network/`): `gossip_protocol`, `peer_manager`, `chain_sync` (catch-up on boot), `chain_monitor` (periodic gap detection/auto-sync), `network_daemon` (health checks). Config in `network/config.json` via `config_loader.get_config()`.
- **Keys/crypto**: secp256k1 ECDSA (`app/utils/CryptoUtils.py`); address = `0x` + last 20 bytes of keccak256(pubkey). Node keystore is AES-256-GCM + PBKDF2 (`KeystoreManager`).
- **User auth**: wallet challenge — `GET /users/auth/get_nonce` → client signs → `POST /users/auth/verify` returns a JWT (`app/core/config.py`, env via `.env`). Nonces use an in-memory dict (Redis is wired but intentionally disabled in `AccountController.py`). Roles: `moet`, `validator`, `client` (frontend also has `admin`).
- **Storage**: degree PDFs/files go to Cloudinary (`StorageController`, `CLOUDINARY_*` env vars).

## Frontend architecture

- Path aliases: `@/` → `src/`, `@configs/` → `front_end/configs/` (axios instance with JWT bearer from `localStorage.access_token`, auto-redirect to `/login` on 401).
- Endpoint paths are centralized in `src/constants/api.ts`; `src/services/*Service.ts` wrap them; `src/hooks/use*.ts` wrap services (TanStack Query). Add new endpoints in that chain rather than calling axios from components.
- Wallets are generated/held client-side (`@noble/secp256k1`, `bip39`); see `src/contexts/WalletContext.tsx` and `components/common/auth/`. Transactions are signed in the browser.
- Role-based access: `src/constants/permissions.ts` (`ROUTE_PERMISSIONS`, `ACTION_PERMISSIONS`) applied in `src/routes/index.tsx` (with `components/common/ProtectedRoute.tsx`). Browser-side signing helpers: `src/utils/signatureUtils.ts`, `src/utils/cryptoUtils.ts`.
- `src/components/ui/` is shadcn-generated — prefer adding via shadcn over hand-editing.
