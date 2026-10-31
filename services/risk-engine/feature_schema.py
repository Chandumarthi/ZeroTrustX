"""
Feature schema definitions and validation logic for ZeroTrustX Risk Engine.
Defines feature names, valid ranges, expected types, and validation rules.
"""

from typing import Any, Dict, List, Tuple, Union

# Complete feature definitions with types, ranges, and descriptions
FEATURES = [
    "device_known",            # bool (0/1): whether device fingerprint is recognized
    "ip_known",                # bool (0/1): whether IP was seen before for this user
    "recent_failed_attempts",  # int [0-10+]: failed login attempts in last hour
    "login_hour",              # int [0-23]: hour of login in UTC
    "time_since_last_login",   # float [0-8760]: hours since last successful login
    "device_changed",          # bool (0/1): device fingerprint changed since last login
    "ip_changed",              # bool (0/1): IP address changed since last login
    "login_frequency",         # float [0-50]: average logins per day over past 30 days
    "is_off_hours",            # bool (0/1): login between 23:00-05:00 UTC
    "failed_to_success_ratio", # float [0-1]: ratio of recent failures to total attempts
]

FEATURE_RANGES: Dict[str, Tuple[Union[int, float], Union[int, float]]] = {
    "device_known": (0, 1),
    "ip_known": (0, 1),
    "recent_failed_attempts": (0, 50),
    "login_hour": (0, 23),
    "time_since_last_login": (0, 8760),
    "device_changed": (0, 1),
    "ip_changed": (0, 1),
    "login_frequency": (0, 100),
    "is_off_hours": (0, 1),
    "failed_to_success_ratio": (0.0, 1.0),
}

FEATURE_DESCRIPTIONS: Dict[str, str] = {
    "device_known": "Whether the client device fingerprint is recognized for this user (0 or 1)",
    "ip_known": "Whether the client IP address was previously seen for this user (0 or 1)",
    "recent_failed_attempts": "Number of failed login attempts in the past 60 minutes",
    "login_hour": "UTC hour of the login event (0-23)",
    "time_since_last_login": "Elapsed hours since the last successful authentication (0-8760)",
    "device_changed": "Whether the device changed compared to the preceding login session (0 or 1)",
    "ip_changed": "Whether the IP address changed compared to the preceding login session (0 or 1)",
    "login_frequency": "Historical daily login frequency over a 30-day baseline period",
    "is_off_hours": "Flag indicating if login occurred during off-hours 23:00 - 05:00 UTC (0 or 1)",
    "failed_to_success_ratio": "Proportion of failed attempts to total login attempts in observation window (0.0 - 1.0)",
}

LABEL_COLUMN = "is_suspicious"  # 0 = normal, 1 = suspicious

MODEL_VERSION = "1.0.0"


def validate_feature_schema(features: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate a dictionary of input features against the schema:
    - Verifies all required features are present
    - Verifies data types (must be int, float, or bool)
    - Verifies values fall within valid FEATURE_RANGES
    
    Returns:
        (is_valid: bool, errors: list[str])
    """
    if not isinstance(features, dict):
        return False, ["Features payload must be a JSON object / dictionary"]

    errors: List[str] = []

    # 1. Check for missing required features
    for feature in FEATURES:
        if feature not in features:
            errors.append(f"Missing required feature: '{feature}'")

    # If features are missing, return early with errors
    if errors:
        return False, errors

    # 2. Check types and ranges for provided features
    for feature in FEATURES:
        val = features[feature]

        # Disallow None, string, lists, objects
        if val is None or isinstance(val, (str, list, dict, set, tuple)):
            errors.append(f"Feature '{feature}' must be a numeric value, got {type(val).__name__}")
            continue

        if not isinstance(val, (int, float, bool)):
            errors.append(f"Feature '{feature}' must be a numeric value, got {type(val).__name__}")
            continue

        # Convert bool to int for validation and numeric processing
        num_val = float(val) if not isinstance(val, bool) else (1.0 if val else 0.0)

        min_val, max_val = FEATURE_RANGES[feature]
        if num_val < min_val or num_val > max_val:
            errors.append(
                f"Feature '{feature}' value {val} is out of valid range [{min_val}, {max_val}]"
            )

    is_valid = len(errors) == 0
    return is_valid, errors
