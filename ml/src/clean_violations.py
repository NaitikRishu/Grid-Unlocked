#!/usr/bin/env python3
"""Clean violations dataset for Phase 1.

Functions: load_data(), validate_schema(), clean_data(), export_data(), main()
Writes cleaned CSV to ml/data/processed/violations_clean.csv and stats JSON.
"""
import os
import json
from typing import Dict, Any

import pandas as pd
import numpy as np


RAW_PATH = os.path.join('ml', 'data', 'raw', 'violations.csv')
OUT_DIR = os.path.join('ml', 'data', 'processed')
OUT_CSV = os.path.join(OUT_DIR, 'violations_clean.csv')
OUT_STATS = os.path.join(OUT_DIR, 'violations_clean_stats.json')


REQUIRED_COLUMNS = ['id', 'latitude', 'longitude', 'created_datetime']


def load_data(path: str) -> pd.DataFrame:
    return pd.read_csv(path, low_memory=False)


def validate_schema(df: pd.DataFrame) -> Dict[str, Any]:
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    return {'missing_required_columns': missing}


def classify_columns(df: pd.DataFrame) -> Dict[str, list]:
    total = len(df)
    high_missing = [c for c in df.columns if df[c].isna().sum() / max(1, total) > 0.9]
    core = ['id', 'latitude', 'longitude', 'violation_type', 'created_datetime', 'validation_status', 'junction_name', 'police_station']
    core_features = [c for c in core if c in df.columns]
    optional = [c for c in df.columns if c not in core_features and c not in high_missing]
    return {
        'core_features': core_features,
        'optional_features': optional,
        'high_missing_features': high_missing,
    }


def parse_datetimes(df: pd.DataFrame) -> pd.DataFrame:
    to_parse = ['created_datetime', 'modified_datetime', 'validation_timestamp', 'data_sent_to_scita_timestamp']
    for c in to_parse:
        if c in df.columns:
            df[c] = pd.to_datetime(df[c], errors='coerce', utc=True)
    return df


def normalize_text_cols(df: pd.DataFrame) -> pd.DataFrame:
    for c in ['violation_type', 'validation_status', 'vehicle_type']:
        if c in df.columns:
            df[c] = df[c].astype(str).str.strip().str.lower().replace({'nan': None})
    return df


def geospatial_filter(df: pd.DataFrame) -> (pd.DataFrame, int):
    # Bengaluru bbox
    lat_min, lat_max = 12.7, 13.2
    lon_min, lon_max = 77.4, 77.8
    before = len(df)
    mask = df['latitude'].notna() & df['longitude'].notna() & \
           (df['latitude'] >= lat_min) & (df['latitude'] <= lat_max) & \
           (df['longitude'] >= lon_min) & (df['longitude'] <= lon_max)
    df_filtered = df[mask].copy()
    dropped = before - len(df_filtered)
    return df_filtered, int(dropped)


def clean_data(df: pd.DataFrame) -> Dict[str, Any]:
    metrics = {}
    metrics['original_rows'] = int(len(df))

    # Deduplicate
    if 'id' in df.columns:
        before = len(df)
        df = df.drop_duplicates(subset=['id'])
        metrics['deduplicated_rows'] = int(len(df))
        metrics['duplicates_removed'] = int(before - len(df))
    else:
        metrics['deduplicated_rows'] = int(len(df))
        metrics['duplicates_removed'] = 0

    df = parse_datetimes(df)
    df = normalize_text_cols(df)

    metrics.update(classify_columns(df))

    if 'latitude' in df.columns and 'longitude' in df.columns:
        df, dropped_coords = geospatial_filter(df)
    else:
        dropped_coords = 0
    metrics['dropped_coordinates'] = dropped_coords

    # Note: closed_datetime is fully missing; do not compute durations here

    nulls = {c: int(df[c].isna().sum()) for c in df.columns}
    metrics['null_counts'] = nulls
    metrics['final_rows'] = int(len(df))
    return df, metrics


def export_data(df: pd.DataFrame, out_csv: str, stats: dict):
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    df.to_csv(out_csv, index=False)
    with open(OUT_STATS, 'w', encoding='utf8') as f:
        json.dump(stats, f, indent=2)


def main():
    df = load_data(RAW_PATH)
    schema = validate_schema(df)
    if schema['missing_required_columns']:
        print('Warning: missing required columns:', schema['missing_required_columns'])
    cleaned_df, metrics = clean_data(df)
    export_data(cleaned_df, OUT_CSV, metrics)
    print('Violations cleaned:', OUT_CSV)


if __name__ == '__main__':
    main()
