import pytest
import os
import sys
import sqlite3
import tempfile
import redis
from unittest.mock import MagicMock

# Add back_end directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from app.main import create_app
from app.database.database import schema_sql

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary file for the database
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app()
    app.config.update({
        "TESTING": True,
        "DATABASE": db_path,
    })

    # Initialize the temporary database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.executescript(schema_sql)
    conn.commit()
    conn.close()

    # Mock Redis if it's not running
    try:
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        r.ping()
    except redis.exceptions.ConnectionError:
        app.redis = MagicMock()
    
    # Patch the database path in the app's components
    import app.database.database as db_mod
    import app.database.connection as conn_mod
    original_db_path = db_mod.DB_PATH
    original_conn_path = conn_mod.DB_PATH
    db_mod.DB_PATH = db_path
    conn_mod.DB_PATH = db_path

    yield app

    # Cleanup
    db_mod.DB_PATH = original_db_path
    conn_mod.DB_PATH = original_conn_path
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()
