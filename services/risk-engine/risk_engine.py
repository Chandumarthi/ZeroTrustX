"""
Core ZeroTrustX Risk Engine.
Implements a hybrid zero-trust risk assessment engine combining machine learning
anomaly inference with deterministic contextual security policies.
"""

import os
import json
import datetime
import logging
from typing import Dict, List, Tuple, Any, Optional

import joblib
import pandas as pd

from feature_schema import FEATURES, FEATURE_RANGES, MODEL_VERSION, validate_feature_schema

logger = logging.getLogger("ZeroTrustX.RiskEngine")


class RiskEngine:
    """
    Hybrid Adaptive Risk Engine.
    Principle: NEVER TRUST, ALWAYS VERIFY.
    
    Combines:
    - ML Random Forest model inference (anomaly suspicion probability)
    - Contextual rule-based policy scoring
    """

    def __init__(self, model_dir: str = "./models"):
        """
        Initialize the RiskEngine.
        
        Args:
            model_dir: Directory containing trained model artifacts.
            
        Raises:
            RuntimeError: If model artifacts are missing or invalid.
        """
        self.model_dir = os.path.abspath(model_dir)
        self.model = None
        self.feature_names: List[str] = []
        self.metadata: Dict[str, Any] = {}
        self.model_version: str = MODEL_VERSION

        # Fail fast: Never silently fallback to low risk
        self.load_model()

    def load_model(self) -> None:
        """
        Load serialized model and feature names from disk.
        
        Raises:
            RuntimeError: If artifacts cannot be located or loaded.
        """
        model_path = os.path.join(self.model_dir, "risk_model.pkl")
        features_path = os.path.join(self.model_dir, "feature_names.pkl")
        metadata_path = os.path.join(self.model_dir, "model_metadata.json")

        if not os.path.exists(model_path):
            raise RuntimeError(
                f"ML Risk Model file not found at: '{model_path}'. "
                "Failing fast to prevent unverified zero-risk fallback."
            )

        if not os.path.exists(features_path):
            raise RuntimeError(
                f"Feature schema definition file not found at: '{features_path}'."
            )

        try:
            self.model = joblib.load(model_path)
            self.feature_names = joblib.load(features_path)
        except Exception as e:
            raise RuntimeError(f"Failed to load risk model artifacts from {self.model_dir}: {str(e)}") from e

        # Validate feature list matches schema
        missing_feats = [f for f in FEATURES if f not in self.feature_names]
        if missing_feats:
            raise RuntimeError(f"Loaded feature names are incomplete. Missing: {missing_feats}")

        # Load optional metadata
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    self.model_version = self.metadata.get("version", MODEL_VERSION)
            except Exception as e:
                logger.warning("Could not read model metadata: %s", str(e))

        logger.info(
            "Loaded Risk Model version %s with %d features from %s",
            self.model_version,
            len(self.feature_names),
            self.model_dir,
        )

    def validate_features(self, features: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate input feature map against expected schema, types, and ranges.
        
        Returns:
            (is_valid: bool, errors: list[str])
        """
        return validate_feature_schema(features)

    def ml_predict(self, features: Dict[str, Any]) -> Tuple[float, str]:
        """
        Execute ML model inference to predict suspicion probability.
        
        Args:
            features: Dictionary containing feature key-values.
            
        Returns:
            (probability_suspicious: float, model_version: str)
        """
        if self.model is None:
            raise RuntimeError("ML model is not loaded.")

        # Construct dataframe with strict feature ordering
        feature_row = {}
        for feat in self.feature_names:
            val = features[feat]
            # Convert bool to numeric
            feature_row[feat] = float(val) if not isinstance(val, bool) else (1.0 if val else 0.0)

        df = pd.DataFrame([feature_row], columns=self.feature_names)

        # Run predict_proba -> extract class 1 (suspicious) probability
        proba = self.model.predict_proba(df)[0][1]
        return round(float(proba), 4), self.model_version

    def rule_based_score(self, features: Dict[str, Any]) -> Tuple[int, List[str]]:
        """
        Calculate deterministic contextual rule-based risk score.
        
        Rules:
          - device_known = 0: +15
          - ip_known = 0: +10
          - recent_failed_attempts: +8 per attempt, max +40
          - is_off_hours = 1: +10
          - device_changed = 1: +12
          - ip_changed = 1: +5
          - failed_to_success_ratio > 0.5: +15
          
        Returns:
            (rule_score: int, explanations: list[str])
        """
        score = 0
        explanations: List[str] = []

        # 1. Device unknown
        if int(features.get("device_known", 1)) == 0:
            score += 15
            explanations.append("Unrecognized device fingerprint (+15 risk)")

        # 2. IP unknown
        if int(features.get("ip_known", 1)) == 0:
            score += 10
            explanations.append("Unrecognized IP address (+10 risk)")

        # 3. Recent failed attempts
        failed_attempts = int(features.get("recent_failed_attempts", 0))
        if failed_attempts > 0:
            attempt_points = min(40, failed_attempts * 8)
            score += attempt_points
            explanations.append(
                f"Recent failed login attempts detected ({failed_attempts} attempts, +{attempt_points} risk)"
            )

        # 4. Off-hours login
        if int(features.get("is_off_hours", 0)) == 1:
            score += 10
            explanations.append("Authentication attempt during off-hours (23:00 - 05:00 UTC, +10 risk)")

        # 5. Device changed
        if int(features.get("device_changed", 0)) == 1:
            score += 12
            explanations.append("Device fingerprint changed since last successful authentication (+12 risk)")

        # 6. IP changed
        if int(features.get("ip_changed", 0)) == 1:
            score += 5
            explanations.append("IP address changed since last successful authentication (+5 risk)")

        # 7. Failed-to-success ratio > 0.5
        ratio = float(features.get("failed_to_success_ratio", 0.0))
        if ratio > 0.5:
            score += 15
            explanations.append(f"Elevated failed-to-success attempt ratio ({ratio:.2f} > 0.50, +15 risk)")

        return score, explanations

    def calculate_hybrid_score(self, ml_prob: float, rule_score: int) -> float:
        """
        Calculate weighted hybrid risk score clamped to [0.0, 100.0].
        Formula: (ml_prob * 40) + (rule_score * 0.6)
        
        Args:
            ml_prob: ML suspicion probability (0.0 to 1.0)
            rule_score: Integer rule-based risk score
            
        Returns:
            Clamped risk score (0.0 to 100.0)
        """
        hybrid = (ml_prob * 40.0) + (rule_score * 0.6)
        clamped = max(0.0, min(100.0, hybrid))
        return round(float(clamped), 2)

    def determine_risk_level(self, score: float) -> str:
        """
        Map numerical score to standard ZeroTrustX risk tiers:
        - LOW: score < 30
        - MEDIUM: 30 <= score < 60
        - HIGH: 60 <= score < 80
        - CRITICAL: score >= 80
        """
        if score < 30.0:
            return "LOW"
        elif score < 60.0:
            return "MEDIUM"
        elif score < 80.0:
            return "HIGH"
        else:
            return "CRITICAL"

    def determine_access_decision(
        self,
        risk_level: str,
        otp_verified: bool = False,
        score: Optional[float] = None
    ) -> str:
        """
        Map risk level and authentication context to policy decisions:
        - LOW -> ALLOW
        - MEDIUM -> STEP_UP_VERIFICATION (OTP lowers to ALLOW if score < 45)
        - HIGH -> RESTRICT
        - CRITICAL -> BLOCK
        """
        level = risk_level.upper()

        if level == "LOW":
            return "ALLOW"

        if level == "MEDIUM":
            if otp_verified:
                if score is None or score < 45.0:
                    return "ALLOW"
            return "STEP_UP_VERIFICATION"

        if level == "HIGH":
            return "RESTRICT"

        if level == "CRITICAL":
            return "BLOCK"

        return "STEP_UP_VERIFICATION"

    def generate_explanation(
        self,
        risk_level: str,
        rule_explanations: List[str],
        ml_prob: float
    ) -> List[str]:
        """
        Generate human-readable explanation entries for audit trail.
        """
        explanations: List[str] = []

        if rule_explanations:
            explanations.extend(rule_explanations)
        else:
            explanations.append("Baseline behavioral profile verified. No anomalous rule triggers.")

        explanations.append(
            f"ZeroTrustX ML Anomaly Engine assessed a {ml_prob * 100:.1f}% suspicion probability."
        )

        return explanations

    def assess(self, features: Dict[str, Any], otp_verified: bool = False) -> Dict[str, Any]:
        """
        Perform complete zero-trust risk assessment on an authentication event.
        
        Args:
            features: Dictionary of authentication telemetry features
            otp_verified: Whether an MFA OTP challenge was already successfully verified
            
        Returns:
            Dict containing score, risk level, access decision, explanations, and metadata.
            
        Raises:
            ValueError: If input feature validation fails.
        """
        # 1. Feature validation
        is_valid, errors = self.validate_features(features)
        if not is_valid:
            raise ValueError(f"Feature validation failed: {'; '.join(errors)}")

        # 2. ML Anomaly Prediction
        ml_prob, model_version = self.ml_predict(features)

        # 3. Rule-based contextual score
        rule_score, rule_explanations = self.rule_based_score(features)

        # 4. Calculate hybrid score
        risk_score = self.calculate_hybrid_score(ml_prob, rule_score)

        # 5. Determine tier and policy decision
        risk_level = self.determine_risk_level(risk_score)
        access_decision = self.determine_access_decision(
            risk_level=risk_level,
            otp_verified=otp_verified,
            score=risk_score
        )

        # 6. Explanations
        explanation = self.generate_explanation(risk_level, rule_explanations, ml_prob)

        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "access_decision": access_decision,
            "ml_probability": ml_prob,
            "rule_based_score": rule_score,
            "model_version": model_version,
            "explanation": explanation,
            "feature_validation": {"valid": True, "errors": []},
            "timestamp": timestamp,
        }
