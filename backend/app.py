from flask import Flask
from routes import predict_bp

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

# Register Blueprint
app.register_blueprint(predict_bp)

if __name__ == "__main__":
    app.run(debug=True)