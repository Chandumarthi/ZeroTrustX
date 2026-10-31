"""
Flask Application for ZeroTrustX Adaptive Risk Engine.
Provides internal HTTP endpoints for microservice authentication risk assessments.
"""

import os
import time
import hmac
import logging
import datetime
from collections import defaultdict
from typing import Optional

from dotenv import load_dotenv
from flask import Flask, request, jsonify, g

from risk_engine import RiskEngine
from feature_schema import validate_feature_schema

load_dotenv()

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ZeroTrustX.API")

# Global in-memory rate limiter for internal microservice protection
# Structure: client_ip -> list of timestamps
_rate_limit_records = defaultdict(list)
RATE_LIMIT_WINDOW_SECONDS = 60
DEFAULT_MAX_REQUESTS_PER_WINDOW = 300


def check_rate_limit(client_ip: str, max_requests: int = DEFAULT_MAX_REQUESTS_PER_WINDOW) -> bool:
    """
    Sliding window in-memory rate limiter per IP address.
    Returns True if allowed, False if rate limit exceeded.
    """
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS

    # Filter out timestamps outside window
    timestamps = [ts for ts in _rate_limit_records[client_ip] if ts > window_start]
    _rate_limit_records[client_ip] = timestamps

    if len(timestamps) >= max_requests:
        return False

    _rate_limit_records[client_ip].append(now)
    return True


def create_app(model_dir: Optional[str] = None, engine: Optional[RiskEngine] = None) -> Flask:
    """
    Flask Application Factory for ZeroTrustX Risk Engine.
    """
    app = Flask(__name__)

    # Internal service configuration
    api_key = os.getenv("ML_INTERNAL_API_KEY", "ztx-risk-engine-internal-secret")
    app.config["ML_INTERNAL_API_KEY"] = api_key

    # Initialize Risk Engine (Fail Fast)
    if engine is not None:
        app.risk_engine = engine
    else:
        resolved_model_dir = model_dir or os.getenv("MODEL_DIR", os.path.join(os.path.dirname(__file__), "models"))
        logger.info("Initializing Risk Engine from model directory: %s", resolved_model_dir)
        try:
            app.risk_engine = RiskEngine(model_dir=resolved_model_dir)
            logger.info("Risk Engine initialized successfully (version: %s)", app.risk_engine.model_version)
        except Exception as e:
            logger.critical("FATAL: Failed to initialize Risk Engine on startup: %s", str(e))
            raise

    # Request timing & structured audit logging (CORS deliberately disabled)
    @app.before_request
    def before_request_logging():
        g.start_time = time.time()

        # Enforce API Key authentication for all /api/* routes
        if request.path.startswith("/api/"):
            auth_header = request.headers.get("Authorization", "")
            x_api_key = request.headers.get("X-API-Key", "")
            x_internal_key = request.headers.get("X-Internal-API-Key", "")

            extracted_key = None
            if auth_header.startswith("Bearer "):
                extracted_key = auth_header[7:].strip()
            elif x_api_key:
                extracted_key = x_api_key.strip()
            elif x_internal_key:
                extracted_key = x_internal_key.strip()

            expected_key = app.config["ML_INTERNAL_API_KEY"]

            if not extracted_key or not hmac.compare_digest(extracted_key, expected_key):
                return jsonify({
                    "error": "Unauthorized",
                    "message": "Invalid or missing ML internal API key"
                }), 401

    @app.after_request
    def after_request_logging(response):
        duration_ms = (time.time() - getattr(g, "start_time", time.time())) * 1000.0
        client_ip = request.remote_addr or "unknown"
        # Log request without exposing sensitive payload or keys
        logger.info(
            "%s %s %d %.2fms - IP: %s",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
            client_ip
        )
        return response

    # ==========================================
    # Error Handlers
    # ==========================================
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad Request", "message": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized", "message": str(e)}), 401

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not Found", "message": "The requested endpoint does not exist"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method Not Allowed", "message": "HTTP method not supported"}), 405

    @app.errorhandler(429)
    def rate_limit_error(e):
        return jsonify({
            "error": "Too Many Requests",
            "message": "Rate limit exceeded. Please throttle authentication assessment requests."
        }), 429

    @app.errorhandler(500)
    def internal_server_error(e):
        logger.error("Internal Server Error: %s", str(e), exc_info=True)
        return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred"}), 500

    # ==========================================
    # Routes
    # ==========================================
    @app.route("/health", methods=["GET"])
    def liveness_check():
        """Public health check endpoint (no auth required)"""
        return jsonify({
            "status": "healthy",
            "service": "ZeroTrustX Risk Engine",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }), 200

    @app.route("/api/health", methods=["GET"])
    def detailed_health_check():
        """Detailed authenticated health check with model metadata"""
        engine: RiskEngine = app.risk_engine
        return jsonify({
            "status": "healthy",
            "service": "ZeroTrustX Risk Engine",
            "model_version": engine.model_version,
            "features_loaded": len(engine.feature_names),
            "metadata": engine.metadata,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }), 200

    @app.route("/api/assess", methods=["POST"])
    def assess_risk():
        """
        Assess risk of an authentication attempt.
        Expected JSON Body:
        {
            "features": {
                "device_known": 1,
                "ip_known": 1,
                ...
            },
            "otp_verified": false
        }
        """
        # Rate Limiting
        client_ip = request.remote_addr or "127.0.0.1"
        if not check_rate_limit(client_ip):
            return jsonify({
                "error": "Too Many Requests",
                "message": "Rate limit exceeded for authentication risk evaluation"
            }), 429

        payload = request.get_json(silent=True)
        if not payload or not isinstance(payload, dict):
            return jsonify({
                "error": "Bad Request",
                "message": "Request body must be a valid JSON object"
            }), 400

        if "features" not in payload:
            return jsonify({
                "error": "Bad Request",
                "message": "Missing required field: 'features'"
            }), 400

        features = payload.get("features")
        if not isinstance(features, dict):
            return jsonify({
                "error": "Bad Request",
                "message": "Field 'features' must be a JSON object"
            }), 400

        otp_verified = bool(payload.get("otp_verified", False))

        # Validate feature schema
        is_valid, validation_errors = validate_feature_schema(features)
        if not is_valid:
            return jsonify({
                "error": "Bad Request",
                "message": "Feature validation failed",
                "details": validation_errors
            }), 400

        try:
            assessment = app.risk_engine.assess(features, otp_verified=otp_verified)
            return jsonify(assessment), 200
        except ValueError as ve:
            return jsonify({
                "error": "Bad Request",
                "message": str(ve)
            }), 400
        except Exception as e:
            logger.error("Error executing risk assessment: %s", str(e), exc_info=True)
            return jsonify({
                "error": "Internal Server Error",
                "message": "Failed to evaluate risk score"
            }), 500

    return app


# Application entry point for WSGI / direct execution
app = None
try:
    app = create_app()
except Exception as exc:
    # Allows module import in test environments that provide mock engines
    logger.warning("Default app creation deferred: %s", str(exc))

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5001))
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    if app is None:
        app = create_app()
    app.run(host=host, port=port, debug=False)
