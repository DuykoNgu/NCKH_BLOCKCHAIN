from flask import Flask, render_template
from app.controllers.v1.NFTController import nft_bp
from app.controllers.v1.UserController import user_bp
from app.controllers.v1.BlockController import block_bp
from app.controllers.v1.TransactionController import transaction_bp

app = Flask(__name__)

# Register blueprints
app.register_blueprint(nft_bp)
app.register_blueprint(user_bp)
app.register_blueprint(block_bp)
app.register_blueprint(transaction_bp)

@app.route("/")
def index():
     return render_template("index.html")
