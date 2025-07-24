from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all origins

    from .routes import bp as main_bp
    from .routes import auth_bp
    from .routes import live_sessions_bp
    from .routes import products_bp
    from .routes import messages_bp
    from .routes import image_upload_bp
    from .routes import reservations_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(live_sessions_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(image_upload_bp)
    app.register_blueprint(reservations_bp)

    return app