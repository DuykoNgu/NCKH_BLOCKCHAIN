import json
from typing import Any


def _to_bytes(data: Any) -> bytes:
    if isinstance(data, dict):
        return json.dumps(data, sort_keys=True).encode('utf-8')
    elif isinstance(data, str):
        return data.encode('utf-8')
    elif isinstance(data, bytes):
        return data
    else:
        return str(data).encode('utf-8')