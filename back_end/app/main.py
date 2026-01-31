"""
Main entry point for the Flask application
"""
from flask import Flask
from app.controllers.v1.BlockController import block_bp
from app.controllers.v1.AccountController import user_bp
from app.controllers.v1.NFTController import nft_bp
from app.database.database import init_db


def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Register blueprints
    app.register_blueprint(block_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(nft_bp)
    
    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    # Initialize database
    init_db()
    
    # Run the application
    app.run(host="127.0.0.1", port=5000, debug=True)