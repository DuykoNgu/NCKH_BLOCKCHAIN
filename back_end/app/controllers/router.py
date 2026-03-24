from flask import Flask
import redis
from app.controllers.v1.BlockController import block_bp
from app.controllers.v1.NetworkController import network_bp
from app.controllers.v1.NFTController import nft_bp
from app.controllers.v1.AuthController import auth_bp

def create_app():
    app = Flask(__name__)
    r = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)
    app.register_blueprint(block_bp)
    app.register_blueprint(network_bp)
    app.register_blueprint(nft_bp)
    app.register_blueprint(auth_bp)
    return app