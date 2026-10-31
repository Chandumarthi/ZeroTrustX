"""
Comprehensive Unit Tests for ZeroTrustX Risk Engine.
Tests feature validation, ML inference, rule-based scoring, hybrid calculation,
risk levels, policy decisions, and edge case error handling.
"""

import sys
import os
import json
import pytest
import numpy as np
import joblib

# Add service directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from feature_schema import FEATURES, FEATURE_RANGES, MODEL_VERSION
from risk_engine import RiskEngine


class MockMLModel:
    """Mock ML model implementing scikit-learn predict_proba interface for isolated testing."""
    def predict_proba(self, X):
        results = []
        for _, row in X.iterrows():
            # If device unknown or high failures, simulate high suspicion probability
            if row.get("device_known") == 0 or row.get("recent_failed_attempts", 0) >= 3:
                results.append([0.10, 0.90])
            else:
                results.append([0.95, 0.05])
        return np.array(results)


@pytest.fixture
def mock_model_dir(tmp_path):
    """Fixture to create a temporary mock model directory with artifacts."""
    model_path = tmp_path / "risk_model.pkl"
    features_path = tmp_path / "feature_names.pkl"
    metadata_path = tmp_path / "model_metadata.json"

    joblib.dump(MockMLModel(), model_path)
    joblib.dump(FEATURES, features_path)

    metadata = {
        "version": "1.0.0-mock",
        "n_features": len(FEATURES),
        "feature_names": FEATURES,
        "algorithm": "MockRandomForest"
    }
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f)

    return str(tmp_path)


@pytest.fixture
def engine(mock_model_dir):
    """Fixture providing initialized RiskEngine instance with mock model."""
    return RiskEngine(model_dir=mock_model_dir)


@pytest.fixture
def valid_normal_features():
    """Standard baseline authentication event."""
    return {
        "device_known": 1,
        "ip_known": 1,
        "recent_failed_attempts": 0,
        "login_hour": 14,
        "time_since_last_login": 12.5,
        "device_changed": 0,
        "ip_changed": 0,
        "login_frequency": 3.2,
        "is_off_hours": 0,
        "failed_to_success_ratio": 0.0,
    }


@pytest.fixture
def valid_suspicious_features():
    """Highly anomalous authentication event."""
    return {
        "device_known": 0,
        "ip_known": 0,
        "recent_failed_attempts": 6,
        "login_hour": 2,
        "time_since_last_login": 720.0,
        "device_changed": 1,
        "ip_changed": 1,
        "login_frequency": 12.0,
        "is_off_hours": 1,
        "failed_to_success_ratio": 0.85,
    }


# =========================================================================
# TEST 1: Feature validation succeeds for valid features
# =========================================================================
def test_feature_validation_valid(engine, valid_normal_features):
    is_valid, errors = engine.validate_features(valid_normal_features)
    assert is_valid is True
    assert len(errors) == 0


# =========================================================================
# TEST 2: Missing feature raises validation error
# =========================================================================
def test_feature_validation_missing(engine, valid_normal_features):
    features = valid_normal_features.copy()
    del features["device_known"]
    is_valid, errors = engine.validate_features(features)
    assert is_valid is False
    assert any("device_known" in err for err in errors)

    # Calling assess() directly should raise ValueError
    with pytest.raises(ValueError, match="Feature validation failed"):
        engine.assess(features)


# =========================================================================
# TEST 3: Out-of-range feature fails validation
# =========================================================================
def test_feature_validation_out_of_range(engine, valid_normal_features):
    # login_hour out of [0, 23]
    features = valid_normal_features.copy()
    features["login_hour"] = 25
    is_valid, errors = engine.validate_features(features)
    assert is_valid is False
    assert any("login_hour" in err for err in errors)

    # failed_to_success_ratio out of [0, 1]
    features2 = valid_normal_features.copy()
    features2["failed_to_success_ratio"] = 1.5
    is_valid2, errors2 = engine.validate_features(features2)
    assert is_valid2 is False
    assert any("failed_to_success_ratio" in err for err in errors2)


# =========================================================================
# TEST 4: Rule-based scoring produces 0 for clean normal login
# =========================================================================
def test_rule_based_low_risk(engine, valid_normal_features):
    score, explanations = engine.rule_based_score(valid_normal_features)
    assert score == 0
    assert len(explanations) == 0


# =========================================================================
# TEST 5: Rule-based scoring produces high score for suspicious login
# =========================================================================
def test_rule_based_high_risk(engine, valid_suspicious_features):
    # device_known=0 (+15), ip_known=0 (+10), recent_failed=6 (max 40),
    # is_off_hours=1 (+10), device_changed=1 (+12), ip_changed=1 (+5), ratio=0.85 (+15)
    # Total = 15+10+40+10+12+5+15 = 107
    score, explanations = engine.rule_based_score(valid_suspicious_features)
    assert score >= 100
    assert len(explanations) >= 6


# =========================================================================
# TEST 6: Hybrid score clamping (0 to 100)
# =========================================================================
def test_hybrid_score_clamping(engine):
    # High values clamped at 100
    high_score = engine.calculate_hybrid_score(ml_prob=1.0, rule_score=200)
    assert high_score == 100.0

    # Low values clamped at 0
    low_score = engine.calculate_hybrid_score(ml_prob=0.0, rule_score=-50)
    assert low_score == 0.0

    # Intermediate calculation
    # (0.5 * 40) + (50 * 0.6) = 20 + 30 = 50.0
    mid_score = engine.calculate_hybrid_score(ml_prob=0.5, rule_score=50)
    assert mid_score == 50.0


# =========================================================================
# TEST 7: Risk level thresholds (LOW, MEDIUM, HIGH, CRITICAL)
# =========================================================================
def test_risk_level_thresholds(engine):
    assert engine.determine_risk_level(0.0) == "LOW"
    assert engine.determine_risk_level(29.9) == "LOW"
    assert engine.determine_risk_level(30.0) == "MEDIUM"
    assert engine.determine_risk_level(59.9) == "MEDIUM"
    assert engine.determine_risk_level(60.0) == "HIGH"
    assert engine.determine_risk_level(79.9) == "HIGH"
    assert engine.determine_risk_level(80.0) == "CRITICAL"
    assert engine.determine_risk_level(100.0) == "CRITICAL"


# =========================================================================
# TEST 8: Access decision mapping
# =========================================================================
def test_access_decision_mapping(engine):
    # Without OTP
    assert engine.determine_access_decision("LOW", otp_verified=False) == "ALLOW"
    assert engine.determine_access_decision("MEDIUM", otp_verified=False) == "STEP_UP_VERIFICATION"
    assert engine.determine_access_decision("HIGH", otp_verified=False) == "RESTRICT"
    assert engine.determine_access_decision("CRITICAL", otp_verified=False) == "BLOCK"


# =========================================================================
# TEST 9: OTP verification effect on MEDIUM risk
# =========================================================================
def test_otp_verification_effect(engine):
    # MEDIUM with OTP verified and score < 45 -> ALLOW
    assert engine.determine_access_decision("MEDIUM", otp_verified=True, score=40.0) == "ALLOW"
    
    # MEDIUM with OTP verified but score >= 45 -> STEP_UP_VERIFICATION
    assert engine.determine_access_decision("MEDIUM", otp_verified=True, score=50.0) == "STEP_UP_VERIFICATION"

    # HIGH with OTP verified remains RESTRICT
    assert engine.determine_access_decision("HIGH", otp_verified=True, score=65.0) == "RESTRICT"

    # CRITICAL with OTP verified remains BLOCK
    assert engine.determine_access_decision("CRITICAL", otp_verified=True, score=85.0) == "BLOCK"


# =========================================================================
# TEST 10: Human-readable explanations are always generated
# =========================================================================
def test_explanation_generated(engine, valid_normal_features):
    result = engine.assess(valid_normal_features)
    assert isinstance(result["explanation"], list)
    assert len(result["explanation"]) > 0
    assert any("ML" in exp or "baseline" in exp.lower() for exp in result["explanation"])


# =========================================================================
# TEST 11: End-to-end assess for low-risk normal scenario
# =========================================================================
def test_assess_low_risk_scenario(engine, valid_normal_features):
    result = engine.assess(valid_normal_features)
    assert result["risk_level"] == "LOW"
    assert result["access_decision"] == "ALLOW"
    assert result["risk_score"] < 30.0
    assert result["rule_based_score"] == 0
    assert result["feature_validation"]["valid"] is True
    assert "timestamp" in result


# =========================================================================
# TEST 12: End-to-end assess for high-risk / critical scenario
# =========================================================================
def test_assess_high_risk_scenario(engine, valid_suspicious_features):
    result = engine.assess(valid_suspicious_features)
    assert result["risk_level"] in ("HIGH", "CRITICAL")
    assert result["access_decision"] in ("RESTRICT", "BLOCK")
    assert result["risk_score"] >= 60.0
    assert result["rule_based_score"] > 50


# =========================================================================
# TEST 13: Unknown device significantly increases risk
# =========================================================================
def test_assess_unknown_device(engine, valid_normal_features):
    base_result = engine.assess(valid_normal_features)
    
    mod_features = valid_normal_features.copy()
    mod_features["device_known"] = 0
    unknown_dev_result = engine.assess(mod_features)

    assert unknown_dev_result["risk_score"] > base_result["risk_score"]
    assert unknown_dev_result["rule_based_score"] >= 15
    assert any("Unrecognized device" in exp for exp in unknown_dev_result["explanation"])


# =========================================================================
# TEST 14: Multiple failed attempts significantly increase risk
# =========================================================================
def test_assess_multiple_failures(engine, valid_normal_features):
    base_result = engine.assess(valid_normal_features)
    
    fail_features = valid_normal_features.copy()
    fail_features["recent_failed_attempts"] = 4
    failures_result = engine.assess(fail_features)

    assert failures_result["risk_score"] > base_result["risk_score"]
    assert failures_result["rule_based_score"] >= 32  # 4 * 8 = 32
    assert any("failed login attempts" in exp for exp in failures_result["explanation"])


# =========================================================================
# TEST 15: Missing model directory raises RuntimeError (Never silently use low risk)
# =========================================================================
def test_model_not_found_raises():
    with pytest.raises(RuntimeError, match="ML Risk Model file not found"):
        RiskEngine(model_dir="./nonexistent_model_directory_path")
