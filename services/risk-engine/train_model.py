"""
Training pipeline for ZeroTrustX ML Risk Engine.
Trains a scikit-learn RandomForestClassifier on synthetic authentication telemetry,
evaluates classification metrics, and exports serialized model artifacts and metadata.
"""

import os
import json
import datetime
from typing import Dict, Any
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

from feature_schema import FEATURES, LABEL_COLUMN, MODEL_VERSION
from generate_dataset import generate_dataset

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "synthetic_auth_data.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")


def train_risk_model(
    data_path: str = DATA_PATH,
    model_dir: str = MODEL_DIR,
    n_estimators: int = 100,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Execute end-to-end model training, validation, and artifact persistence.
    """
    print("=" * 65)
    print("       ZeroTrustX Risk Engine - Model Training Pipeline        ")
    print("=" * 65)

    # 1. Load or generate dataset
    if not os.path.exists(data_path):
        print(f"[!] Dataset not found at {data_path}. Generating synthetic dataset...")
        df = generate_dataset(output_path=data_path, random_seed=random_state)
    else:
        print(f"[*] Loading dataset from: {data_path}")
        df = pd.read_csv(data_path)

    # 2. Validate feature schema
    print("[*] Validating feature schema...")
    for col in FEATURES:
        if col not in df.columns:
            raise ValueError(f"Required feature column '{col}' missing from dataset!")
    if LABEL_COLUMN not in df.columns:
        raise ValueError(f"Label column '{LABEL_COLUMN}' missing from dataset!")

    X = df[FEATURES]
    y = df[LABEL_COLUMN]

    # Check for NaN / null values
    if X.isnull().sum().sum() > 0 or y.isnull().sum() > 0:
        print("[!] Warning: Null values detected. Dropping null rows...")
        valid_idx = X.notnull().all(axis=1) & y.notnull()
        X = X[valid_idx]
        y = y[valid_idx]

    print(f"[*] Total dataset size: {len(X)} rows across {len(FEATURES)} features")
    print(f"[*] Class distribution: 0 (Normal) = {sum(y == 0)}, 1 (Suspicious) = {sum(y == 1)}")

    # 3. Stratified Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        random_state=random_state,
        stratify=y
    )
    print(f"[*] Training samples: {len(X_train)}, Test samples: {len(X_test)}")

    # 4. Train RandomForestClassifier with balanced class weights
    print(f"[*] Training RandomForestClassifier (n_estimators={n_estimators}, class_weight='balanced')...")
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        random_state=random_state,
        class_weight="balanced",
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    print("[+] Model training completed.")

    # 5. Evaluate on test set
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec_macro = float(precision_score(y_test, y_pred, average="macro"))
    rec_macro = float(recall_score(y_test, y_pred, average="macro"))
    f1_mac = float(f1_score(y_test, y_pred, average="macro"))
    
    prec_suspicious = float(precision_score(y_test, y_pred, pos_label=1))
    rec_suspicious = float(recall_score(y_test, y_pred, pos_label=1))
    f1_suspicious = float(f1_score(y_test, y_pred, pos_label=1))

    auc = float(roc_auc_score(y_test, y_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, target_names=["Normal", "Suspicious"])

    # 6. Display evaluation metrics
    print("\n" + "-" * 65)
    print("                    EVALUATION METRICS                         ")
    print("-" * 65)
    print(f"Accuracy:          {acc:.4f} ({acc * 100:.2f}%)")
    print(f"ROC-AUC Score:     {auc:.4f}")
    print(f"Macro F1-Score:    {f1_mac:.4f}")
    print(f"Suspicious F1:     {f1_suspicious:.4f} (Precision: {prec_suspicious:.4f}, Recall: {rec_suspicious:.4f})")
    print("\nConfusion Matrix:")
    print(f"  TN: {cm[0][0]:<5} | FP: {cm[0][1]:<5}")
    print(f"  FN: {cm[1][0]:<5} | TP: {cm[1][1]:<5}")
    print("\nDetailed Classification Report:")
    print(report)
    print("-" * 65)

    # Feature Importances
    importances = sorted(
        zip(FEATURES, model.feature_importances_),
        key=lambda x: x[1],
        reverse=True
    )
    print("\nFeature Importances:")
    for feat_name, imp in importances:
        print(f"  - {feat_name:<25}: {imp:.4f} ({imp * 100:.1f}%)")

    # 7. Save model artifacts
    os.makedirs(model_dir, exist_ok=True)

    model_path = os.path.join(model_dir, "risk_model.pkl")
    features_path = os.path.join(model_dir, "feature_names.pkl")
    metadata_path = os.path.join(model_dir, "model_metadata.json")

    joblib.dump(model, model_path)
    print(f"[+] Model saved to: {model_path}")

    joblib.dump(FEATURES, features_path)
    print(f"[+] Feature names saved to: {features_path}")

    # 8. Save model metadata
    model_params = model.get_params()
    # Sanitize non-serializable parameters
    serializable_params = {
        k: (v if isinstance(v, (int, float, str, bool, list, dict, type(None))) else str(v))
        for k, v in model_params.items()
    }

    metadata = {
        "version": MODEL_VERSION,
        "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "n_features": len(FEATURES),
        "feature_names": FEATURES,
        "n_training_samples": len(X_train),
        "n_test_samples": len(X_test),
        "test_accuracy": round(acc, 4),
        "test_macro_f1": round(f1_mac, 4),
        "test_suspicious_f1": round(f1_suspicious, 4),
        "test_auc": round(auc, 4),
        "confusion_matrix": cm,
        "model_params": serializable_params,
        "data_source": "synthetic",
        "algorithm": "RandomForestClassifier",
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[+] Metadata saved to: {metadata_path}")

    # 9. DISCLAIMER
    print("\n" + "=" * 65)
    print("                           DISCLAIMER                          ")
    print("=" * 65)
    print("This model is trained on a synthetic authentication telemetry dataset")
    print("designed to model behavioral anomalies, credential abuse, and unusual")
    print("environmental contexts. For production operations, continuous learning")
    print("and fine-tuning with enterprise authentication event streams is advised.")
    print("=" * 65 + "\n")

    return metadata


if __name__ == "__main__":
    train_risk_model()
