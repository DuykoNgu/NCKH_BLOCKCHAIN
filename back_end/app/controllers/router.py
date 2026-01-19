from flask import Flask
from app.controllers import router
import redis
from app.controllers.v1.BlockController import block_bp
from app.controllers.v1.UserController import user_bp
def create_app():
    app = Flask(__name__)
    r = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)
    app.register_blueprint(block_bp)
    app.register_blueprint(user_bp)
    return app