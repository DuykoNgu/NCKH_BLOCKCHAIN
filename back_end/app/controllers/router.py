from flask import Flask
from flask_cors import CORS
from .v1.BlockController import block_bp
from .v1.NFTController import nft_bp

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

app.register_blueprint(block_bp)
app.register_blueprint(nft_bp)