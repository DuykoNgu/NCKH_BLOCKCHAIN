"""
Main entry point for the Flask application
"""
from flask import Flask, request
from app.controllers.v1.BlockController import block_bp
from app.controllers.v1.AccountController import user_bp
from app.controllers.v1.NFTController import nft_bp
from app.controllers.v1.TransactionController import transaction_bp
from app.controllers.v1.AdminController import admin_bp
from app.controllers.v1.StorageController import storage_bp
from app.database.database import init_db


def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Register blueprints
    app.register_blueprint(block_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(nft_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(storage_bp)
    
    @app.after_request
    def after_request(response):
        # Explicitly handle preflight and allowed origins
        origin = request.headers.get('Origin')
        if origin in ['http://localhost:5173', 'http://127.0.0.1:5173']:
            response.headers.add('Access-Control-Allow-Origin', origin)
            
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response
    
    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    # Initialize database
    init_db()
    
    # Run the application
    app.run(host="127.0.0.1", port=5000, debug=True)