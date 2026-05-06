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
    CORS(app)
    r = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)
    app.register_blueprint(block_bp)
    app.register_blueprint(network_bp)
    app.register_blueprint(nft_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(storage_bp)
    return app