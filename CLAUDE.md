# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

EduChain: a custom permissioned (PoA, round-robin) blockchain for issuing and verifying university degrees as NFTs. MOET (Bộ GD&ĐT) acts as super validator; universities run validator/observer nodes. Design diagrams (Vietnamese) live in `SystemEduChain.md`. UI text and many comments are in Vietnamese.

- `back_end/` — Python **Flask** node (the `back_end/README.md` structure tree describing FastAPI/`api/` is outdated; trust the code).
- `front_end/` — React 18 + TypeScript + Vite (rolldown-vite) + Tailwind + shadcn/ui.

## Commands

Backend (run from `back_end/`, after `python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`):

```bash
python setup.py                 # interactive: create encrypted node.keystore + register peer
python run.py                   # full node on :5000 (DB init → blockchain init → P2P → chain sync → validator worker → Flask)
python run.py --port 5002 --db node_b.db --validator-index 1 --total-validators 2   # extra local node
python run.py --no-network      # skip P2P init/sync/daemon
python active_node.py           # interactive: unlock keystore, activate validator, broadcast activation
python create_admin.py          # replace the 'moet' admin account in the SQLite DB
```

`back_end/tests/quick_test.py` is a load script that hits a running node at `http://127.0.0.1:5000` (not a pytest suite). Note `.gitignore` ignores `test_*.py` everywhere, so new test files named that way won't be committed.

Frontend (from `front_end/`): `npm run dev` (port 5173), `npm run build` (`tsc -b && vite build`), `npm run lint`. API base URL comes from `VITE_API_URL` (should end in `/api/v1`).

## Backend architecture

Layering: `app/controllers/v1/*Controller.py` (Flask blueprints, all prefixed `/api/v1/<area>`) → `app/services/` → `app/repositories/` (raw `sqlite3`, no ORM) → `app/models/` (plain classes with `to_dict`). Blueprints are registered in `app/main.py::create_app`; `app/controllers/router.py` is a stale duplicate.

Key cross-cutting pieces:
- **Startup order matters** (`run.py`): `--db` must patch `app.database.database.DB_PATH` *before* any `app.*` import. Default DB is `app/database/node_a.db`.
- **SQLite concurrency**: many threads (Flask, validator worker, network daemon, chain monitor) share one DB file. Writes must go through `acquire_write_lock()`/`release_write_lock()` in `app/database/connection.py`, and connections should be closed promptly. Pass an existing `conn` to repository calls inside a locked section (e.g. `TransactionRepository.create_transaction(tx, conn=conn)`) to avoid self-deadlock.
- **In-memory chain singleton**: `app/blockchain_instance.py` holds the global `BlockChain` (chain list + `mempool` + `authority_set`). On restart it reloads the full chain from DB; DB (`get_local_db_height`) is the source of truth for height. Genesis: the node whose port matches a seed in `network/config.json` creates it; others fetch it from `/api/v1/block/genesis`.
- **Consensus**: `consensus/validator_worker.py` — round-robin slots (`slot_duration` 5s) via `network/ntp_sync.ConsensusTimer`; a node mines only when `slot % total_validators == validator_index` and it has been activated with its decrypted private key (held in memory only, via `/api/v1/auth/activate` or `active_node.py`).
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
