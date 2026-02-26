from flask import Flask, jsonify
from flask_cors import CORS

from routes.donor import donor_bp
from routes.ngo import ngo_bp
from routes.admin import admin_bp

app = Flask(__name__)
# Enable CORS for all routes so the frontend can easily connect
CORS(app)

# Register Blueprints for modular routes
app.register_blueprint(donor_bp, url_prefix='/donate')
# Since the requirement was GET /ngo/donations, we set the prefix to /ngo
app.register_blueprint(ngo_bp, url_prefix='/ngo')
app.register_blueprint(admin_bp, url_prefix='/admin')

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "success",
        "message": "AI Food Redistribution API is running smoothly!"
    }), 200

if __name__ == '__main__':
    # Run in debug mode for hackathon purposes
    app.run(host='0.0.0.0', port=5000, debug=True)
