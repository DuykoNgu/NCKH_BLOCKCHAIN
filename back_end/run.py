"""
Run script for EduChain Backend
This script properly sets up the Python path and starts the Flask server
"""
import sys
import os

# Add back_end directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Now import and run the app
from app.main import app, init_db

if __name__ == "__main__":
    print("=" * 60)
    print("Starting EduChain Backend Server")
    print("=" * 60)
    
    # Initialize database
    print("\n[1/2] Initializing database...")
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization warning: {e}")
    
    # Start Flask server
    print("\n[2/2] Starting Flask server...")
    print(f"Server running at: http://127.0.0.1:5000")
    print("Press CTRL+C to stop\n")
    print("=" * 60)
    
    app.run(host="127.0.0.1", port=5000, debug=True)
