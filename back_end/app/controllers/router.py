from flask import Flask
from flask_cors import CORS
import redis
from app.controllers.v1.BlockController import block_bp
from app.controllers.v1.NetworkController import network_bp
from app.controllers.v1.NFTController import nft_bp
from app.controllers.v1.AuthController import auth_bp
from app.controllers.v1.AccountController import user_bp
from app.controllers.v1.TransactionController import transaction_bp
from app.controllers.v1.StorageController import storage_bp

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    app.register_blueprint(block_bp)
    app.register_blueprint(network_bp)
    app.register_blueprint(nft_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(storage_bp)
    return app