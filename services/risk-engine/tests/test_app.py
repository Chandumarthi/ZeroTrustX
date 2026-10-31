"""
Flask API Integration and Unit Tests for ZeroTrustX Risk Engine.
Validates HTTP endpoints, internal API key authentication, rate limiting,
schema validation, error handling, and assessment responses.
"""

import sys
import os
import json
import pytest
import numpy as np
import joblib

# Add service directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from feature_schema import FEATURES
from risk_engine import RiskEngine
from app import create_app

TEST_API_KEY = "test-internal-secret-key-12345"


class MockMLModel:
    """Mock ML model for Flask test suite."""
    def predict_proba(self, X):
        return np.array([[0.95, 0.05]] * len(X))


@pytest.fixture
def mock_engine(tmp_path):
    """Create initialized RiskEngine using a temporary mock model."""
    model_path = tmp_path / "risk_model.pkl"
    features_path = tmp_path / "feature_names.pkl"
    metadata_path = tmp_path / "model_metadata.json"

    joblib.dump(MockMLModel(), model_path)
    joblib.dump(FEATURES, features_path)

    metadata = {
        "version": "1.0.0-test",
        "n_features": len(FEATURES),
        "feature_names": FEATURES,
        "algorithm": "MockRandomForest"
    }
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f)

    return RiskEngine(model_dir=str(tmp_path))


@pytest.fixture
def app(mock_engine, monkeypatch):
    """Create Flask application configured with mock engine and test key."""
    monkeypatch.setenv("ML_INTERNAL_API_KEY", TEST_API_KEY)
    flask_app = create_app(engine=mock_engine)
    flask_app.config["TESTING"] = True
    flask_app.config["ML_INTERNAL_API_KEY"] = TEST_API_KEY
    return flask_app


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def auth_headers():
    """Valid authentication headers for internal API calls."""
    return {
        "X-API-Key": TEST_API_KEY,
        "Content-Type": "application/json"
    }


@pytest.fixture
def valid_features():
    """Standard valid authentication features dictionary."""
    return {
        "device_known": 1,
        "ip_known": 1,
        "recent_failed_attempts": 0,
        "login_hour": 10,
        "time_since_last_login": 24.0,
        "device_changed": 0,
        "ip_changed": 0,
        "login_frequency": 2.5,
        "is_off_hours": 0,
        "failed_to_success_ratio": 0.0,
    }


# =========================================================================
# TEST 1: GET /health returns 200 without authentication
# =========================================================================
def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "timestamp" in data


# =========================================================================
# TEST 2: GET /api/health without authentication returns 401
# =========================================================================
def test_api_health_no_auth(client):
    res = client.get("/api/health")
    assert res.status_code == 401
    data = res.get_json()
    assert data["error"] == "Unauthorized"


# =========================================================================
# TEST 3: GET /api/health with valid authentication returns 200
# =========================================================================
def test_api_health_with_auth(client, auth_headers):
    res = client.get("/api/health", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "model_version" in data
    assert data["features_loaded"] == len(FEATURES)
    assert "metadata" in data


# =========================================================================
# TEST 4: POST /api/assess without authentication returns 401
# =========================================================================
def test_assess_no_auth(client, valid_features):
    res = client.post("/api/assess", json={"features": valid_features})
    assert res.status_code == 401
    data = res.get_json()
    assert data["error"] == "Unauthorized"


# =========================================================================
# TEST 5: POST /api/assess with valid features returns 200 and assessment
# =========================================================================
def test_assess_valid_features(client, auth_headers, valid_features):
    payload = {
        "features": valid_features,
        "otp_verified": False
    }
    res = client.post("/api/assess", headers=auth_headers, json=payload)
    assert res.status_code == 200
    data = res.get_json()

    # Validate output structure
    assert "risk_score" in data
    assert "risk_level" in data
    assert "access_decision" in data
    assert "ml_probability" in data
    assert "rule_based_score" in data
    assert "model_version" in data
    assert "explanation" in data
    assert "timestamp" in data
    assert data["feature_validation"]["valid"] is True


# =========================================================================
# TEST 6: POST /api/assess with missing features returns 400
# =========================================================================
def test_assess_missing_features(client, auth_headers, valid_features):
    # 6a. Missing "features" field entirely
    res1 = client.post("/api/assess", headers=auth_headers, json={"otp_verified": False})
    assert res1.status_code == 400
    assert res1.get_json()["error"] == "Bad Request"

    # 6b. Missing a specific required feature
    incomplete = valid_features.copy()
    del incomplete["login_hour"]
    res2 = client.post("/api/assess", headers=auth_headers, json={"features": incomplete})
    assert res2.status_code == 400
    assert res2.get_json()["error"] == "Bad Request"
    assert any("login_hour" in d for d in res2.get_json().get("details", []))


# =========================================================================
# TEST 7: POST /api/assess with invalid data types returns 400
# =========================================================================
def test_assess_invalid_types(client, auth_headers, valid_features):
    bad_features = valid_features.copy()
    bad_features["recent_failed_attempts"] = "invalid_string"

    res = client.post("/api/assess", headers=auth_headers, json={"features": bad_features})
    assert res.status_code == 400
    data = res.get_json()
    assert data["error"] == "Bad Request"
    assert any("recent_failed_attempts" in d for d in data.get("details", []))
