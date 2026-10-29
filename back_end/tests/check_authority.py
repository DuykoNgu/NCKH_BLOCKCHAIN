import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DATA_DIR", tempfile.mkdtemp())

import app.main
from app.models.BlockChain import BlockChain
from app.models.Transaction import Transaction
from app.services.BlockChainService import BlockChainService
from app.services.TransactionService import TransactionService
from app.utils.CryptoUtils import CryptoUtils


def signed_tx(payload, pub, priv):
    tx = Transaction(sender_pubkey=pub, sender_address="system", recipient_address="system", payload=payload)
    TransactionService.sign(tx, priv)
    return tx


moet_pub, moet_priv = CryptoUtils.generate_key_pair()
out_pub, out_priv = CryptoUtils.generate_key_pair()
bc = BlockChain()
genesis = BlockChainService.create_genesis_block(bc, moet_pub)

bc.mempool.append(signed_tx({"op": "set", "key": "k", "value": 1}, out_pub, out_priv))
assert not BlockChainService.mine_block(bc, out_priv, out_pub)[1]
bc.authority_set.add(out_pub)
block, _ = BlockChainService.mine_block(bc, out_priv, out_pub)
bc.authority_set.discard(out_pub)
assert not BlockChainService.is_valid_new_block(bc, block, genesis)

assert not BlockChainService.execute_transaction(bc, signed_tx({"op": "validator_add", "public_key": out_pub}, out_pub, out_priv))
assert not BlockChainService.execute_transaction(bc, signed_tx({"op": "account_register", "address": "0xabc", "public_key": out_pub, "role": "moet"}, out_pub, out_priv))
assert out_pub not in bc.authority_set

assert BlockChainService.execute_transaction(bc, signed_tx({"op": "validator_add", "public_key": out_pub}, moet_pub, moet_priv))
assert BlockChainService.is_valid_new_block(bc, block, genesis)

remover = BlockChain()
BlockChainService.create_genesis_block(remover, moet_pub)
remover.authority_set.add(out_pub)
remover.mempool.append(signed_tx({"op": "validator_remove", "public_key": out_pub}, moet_pub, moet_priv))
self_removing, is_new = BlockChainService.mine_block(remover, out_priv, out_pub)
assert is_new and out_pub not in remover.authority_set
assert BlockChainService.add_block(remover, self_removing)
assert not BlockChainService.mine_block(remover, out_priv, out_pub)[1]

bc.chain.append(block)
bc.chain.append(type(block)(block_id="X", index=2, block_header=block.block_header,
                            transactions=[signed_tx({"op": "validator_add", "public_key": "ff"}, out_pub, out_priv)]))
BlockChainService.rebuild_authority_set(bc)
assert bc.authority_set == {moet_pub}

print("✅ authority checks passed")
