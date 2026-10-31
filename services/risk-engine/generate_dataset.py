"""
Synthetic Authentication Dataset Generator for ZeroTrustX Risk Engine.
Generates realistic baseline authentication logs with normal and anomalous/suspicious patterns.
"""

import os
import numpy as np
import pandas as pd
from feature_schema import FEATURES, FEATURE_RANGES, LABEL_COLUMN


def generate_dataset(
    n_samples: int = 10000,
    normal_ratio: float = 0.85,
    random_seed: int = 42,
    output_path: str = "./data/synthetic_auth_data.csv"
) -> pd.DataFrame:
    """
    Generate synthetic authentication events with realistic distributions.
    
    Args:
        n_samples: Total number of samples (default 10,000)
        normal_ratio: Ratio of benign authentication attempts (default 0.85)
        random_seed: Seed for reproducible data generation (default 42)
        output_path: File path to save CSV output
        
    Returns:
        pd.DataFrame containing the generated dataset
    """
    np.random.seed(random_seed)
    
    n_normal = int(n_samples * normal_ratio)
    n_suspicious = n_samples - n_normal

    print(f"[*] Generating {n_samples:,} authentication events: {n_normal:,} normal, {n_suspicious:,} suspicious")

    # ==========================================
    # 1. Normal Login Distributions (85%)
    # ==========================================
    normal_data = {}
    
    # device_known: mostly 1 (90%)
    normal_data["device_known"] = np.random.choice([1, 0], size=n_normal, p=[0.90, 0.10])
    
    # ip_known: mostly 1 (85%)
    normal_data["ip_known"] = np.random.choice([1, 0], size=n_normal, p=[0.85, 0.15])
    
    # recent_failed_attempts: mostly 0-1 (80% 0, 15% 1, 4% 2, 1% 3)
    normal_data["recent_failed_attempts"] = np.random.choice([0, 1, 2, 3], size=n_normal, p=[0.80, 0.15, 0.04, 0.01])
    
    # login_hour: typically normal working/evening hours (7-21 UTC, with slight off-hours spread)
    # 90% in 7-21, 10% in 22-6
    hour_daytime = np.random.randint(7, 22, size=n_normal)
    hour_night = np.random.choice([22, 23, 0, 1, 2, 3, 4, 5, 6], size=n_normal)
    is_daytime_mask = np.random.rand(n_normal) < 0.90
    normal_hours = np.where(is_daytime_mask, hour_daytime, hour_night)
    normal_data["login_hour"] = normal_hours
    
    # is_off_hours: 23:00-05:00 UTC (hours in [23, 0, 1, 2, 3, 4])
    # Deriving directly from login_hour ensures consistency, roughly 10%
    normal_data["is_off_hours"] = np.array(
        [1 if (h >= 23 or h <= 4) else 0 for h in normal_hours], dtype=int
    )
    
    # time_since_last_login: typically 1-48 hours (gamma/lognormal centered around 14h)
    time_normal = np.random.gamma(shape=2.5, scale=6.0, size=n_normal)
    time_normal = np.clip(time_normal, 0.1, 720.0) # max 30 days
    normal_data["time_since_last_login"] = np.round(time_normal, 2)
    
    # device_changed: rarely 1 (5%)
    normal_data["device_changed"] = np.random.choice([1, 0], size=n_normal, p=[0.05, 0.95])
    
    # ip_changed: sometimes 1 (15%)
    normal_data["ip_changed"] = np.random.choice([1, 0], size=n_normal, p=[0.15, 0.85])
    
    # login_frequency: typical range 1-5 logins/day (normal distribution clipped to 0.1-15)
    freq_normal = np.random.normal(loc=3.0, scale=1.2, size=n_normal)
    freq_normal = np.clip(freq_normal, 0.1, 15.0)
    normal_data["login_frequency"] = np.round(freq_normal, 2)
    
    # failed_to_success_ratio: low (0-0.2)
    ratio_normal = np.random.beta(a=0.5, b=5.0, size=n_normal) * 0.2
    normal_data["failed_to_success_ratio"] = np.round(np.clip(ratio_normal, 0.0, 0.25), 3)
    
    normal_data[LABEL_COLUMN] = np.zeros(n_normal, dtype=int)

    # ==========================================
    # 2. Suspicious Login Distributions (15%)
    # ==========================================
    suspicious_data = {}
    
    # device_known: mostly 0 (80%)
    suspicious_data["device_known"] = np.random.choice([0, 1], size=n_suspicious, p=[0.80, 0.20])
    
    # ip_known: mostly 0 (70%)
    suspicious_data["ip_known"] = np.random.choice([0, 1], size=n_suspicious, p=[0.70, 0.30])
    
    # recent_failed_attempts: 3-10+ (Poisson/negative binomial centered around 5-7)
    failed_susp = np.random.poisson(lam=5.5, size=n_suspicious) + np.random.choice([0, 1, 2, 3], size=n_suspicious)
    suspicious_data["recent_failed_attempts"] = np.clip(failed_susp, 1, 25).astype(int)
    
    # login_hour: varied, significantly higher off-hours proportion (~50%)
    susp_hour_day = np.random.randint(5, 23, size=n_suspicious)
    susp_hour_off = np.random.choice([23, 0, 1, 2, 3, 4], size=n_suspicious)
    susp_is_off_mask = np.random.rand(n_suspicious) < 0.50
    susp_hours = np.where(susp_is_off_mask, susp_hour_off, susp_hour_day)
    suspicious_data["login_hour"] = susp_hours
    
    suspicious_data["is_off_hours"] = np.array(
        [1 if (h >= 23 or h <= 4) else 0 for h in susp_hours], dtype=int
    )
    
    # time_since_last_login: unpredictable, often long dormant accounts or rapid bursts
    time_susp = np.random.exponential(scale=120.0, size=n_suspicious)
    suspicious_data["time_since_last_login"] = np.round(np.clip(time_susp, 0.01, 8760.0), 2)
    
    # device_changed: often 1 (75%)
    suspicious_data["device_changed"] = np.random.choice([1, 0], size=n_suspicious, p=[0.75, 0.25])
    
    # ip_changed: often 1 (80%)
    suspicious_data["ip_changed"] = np.random.choice([1, 0], size=n_suspicious, p=[0.80, 0.20])
    
    # login_frequency: high or irregular
    freq_susp = np.random.gamma(shape=2.0, scale=4.0, size=n_suspicious)
    suspicious_data["login_frequency"] = np.round(np.clip(freq_susp, 0.1, 50.0), 2)
    
    # failed_to_success_ratio: high (0.5 - 1.0)
    ratio_susp = np.random.uniform(0.5, 1.0, size=n_suspicious)
    suspicious_data["failed_to_success_ratio"] = np.round(np.clip(ratio_susp, 0.4, 1.0), 3)
    
    suspicious_data[LABEL_COLUMN] = np.ones(n_suspicious, dtype=int)

    # ==========================================
    # 3. Combine and Add Realistic Noise
    # ==========================================
    df_normal = pd.DataFrame(normal_data)
    df_suspicious = pd.DataFrame(suspicious_data)
    
    df = pd.concat([df_normal, df_suspicious], ignore_index=True)

    # Add realistic label noise (1% label flip to simulate noisy real-world audit logs)
    noise_mask = np.random.rand(n_samples) < 0.015
    df.loc[noise_mask, LABEL_COLUMN] = 1 - df.loc[noise_mask, LABEL_COLUMN]

    # Shuffle the dataset
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)

    # Ensure all columns match feature definitions and order
    column_order = FEATURES + [LABEL_COLUMN]
    df = df[column_order]

    # Clamp all features strictly within defined schema ranges
    for feature in FEATURES:
        min_v, max_v = FEATURE_RANGES[feature]
        df[feature] = df[feature].clip(lower=min_v, upper=max_v)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    # Save CSV
    df.to_csv(output_path, index=False)
    print(f"[+] Dataset saved to: {output_path}")

    # Print summary statistics
    print("\n" + "=" * 55)
    print("      SYNTHETIC AUTHENTICATION DATASET SUMMARY      ")
    print("=" * 55)
    print(f"Total Records:      {len(df):,}")
    print(f"Normal Logins:      {int((df[LABEL_COLUMN] == 0).sum()):,} ({(df[LABEL_COLUMN] == 0).mean() * 100:.1f}%)")
    print(f"Suspicious Logins:  {int((df[LABEL_COLUMN] == 1).sum()):,} ({(df[LABEL_COLUMN] == 1).mean() * 100:.1f}%)")
    print("-" * 55)
    print("Feature Means by Label:")
    print(df.groupby(LABEL_COLUMN)[FEATURES].mean().T.to_string())
    print("=" * 55 + "\n")

    return df


if __name__ == "__main__":
    generate_dataset()
