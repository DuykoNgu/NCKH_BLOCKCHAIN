import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)).rsplit('/', 1)[0])

from app.controllers import router

if __name__ == "__main__":
    router.app.run(host="127.0.0.1", port=5000, debug=True)
