#!/usr/bin/env python3
"""Clean inspection script to profile datasets and write docs/dataset_profile.md
This is a temporary clean file (inspect_data_clean.py). If acceptable, we can
move/rename it to ml/src/inspect_data.py later.
"""
import os
import sys
from datetime import datetime
import pandas as pd
import numpy as np
import re

RAW_EVENTS = os.path.join('ml', 'data', 'raw', 'events.csv')
RAW_VIOLATIONS = os.path.join('ml', 'data', 'raw', 'violations.csv')
OUT_REPORT = os.path.join('docs', 'dataset_profile.md')


def detect_id_columns(df):
    ids = []
    for c in df.columns:
        if re.search(r'(^|_)id$|_id$|\bid\b', c, flags=re.I):
            ids.append(c)
        else:
            try:
                if df[c].nunique(dropna=True) >= max(50, 0.9 * len(df)):
                    ids.append(c)
            except Exception:
                pass
    return sorted(set(ids))


def detect_datetime_columns(df):
    candidates = []
    for c in df.columns:
        if re.search(r'date|time|datetime|timestamp', c, flags=re.I):
            candidates.append(c)
            continue
        if df[c].dtype == object:
            sample = df[c].dropna().astype(str).head(100)
            if len(sample) >= 5:
                parsed = pd.to_datetime(sample, errors='coerce')
                if parsed.notna().sum() / len(sample) > 0.6:
                    candidates.append(c)
    return sorted(set(candidates))


def detect_latlon_columns(df):
    lat = [c for c in df.columns if re.search(r'(^|_)lat|latitude', c, flags=re.I) and np.issubdtype(df[c].dtype, np.number)]
    lon = [c for c in df.columns if re.search(r'(^|_)lon|longitude|lng', c, flags=re.I) and np.issubdtype(df[c].dtype, np.number)]
    return sorted(set(lat)), sorted(set(lon))


def detect_event_type_columns(df):
    return [c for c in df.columns if re.search(r'type|event|cause|reason|violation', c, flags=re.I)]


def detect_status_columns(df):
    return [c for c in df.columns if re.search(r'status|state|stage', c, flags=re.I)]


def detect_priority_columns(df):
    return [c for c in df.columns if re.search(r'priority|severity|level', c, flags=re.I)]


def detect_zone_location_columns(df):
    return [c for c in df.columns if re.search(r'zone|junction|location|address|police_station|corridor', c, flags=re.I)]


def missing_summary(df):
    total = len(df)
    rows = []
    for c in df.columns:
        miss = df[c].isna().sum()
        empty = ((df[c] == '') | (df[c] == 'NULL')).sum() if df[c].dtype == object else 0
        rows.append((c, int(miss), f"{100*miss/total:.1f}%", int(empty), 0, int(total-miss)))
    return rows


def column_type_overview(df):
    return df.dtypes.apply(lambda x: x.name).to_dict()


def describe_column(df, col):
    ser = df[col]
    info = {}
    info['dtype'] = ser.dtype.name
    info['non_null'] = int(ser.notna().sum())
    try:
        info['unique'] = int(ser.nunique(dropna=True))
    except Exception:
        info['unique'] = 'n/a'
    if np.issubdtype(ser.dtype, np.number):
        info['min'] = float(ser.min()) if ser.notna().any() else None
        info['max'] = float(ser.max()) if ser.notna().any() else None
        info['mean'] = float(ser.mean()) if ser.notna().any() else None
    try:
        top = ser.dropna().astype(str).value_counts().head(5).to_dict()
        info['top'] = top
    except Exception:
        info['top'] = {}
    return info


def profile_dataframe(df, name):
    out = []
    out.append(f"## {name} Dataset\n")
    out.append(f"- File: {name}\n")
    out.append(f"- Dimensions: {df.shape[0]} rows × {df.shape[1]} columns\n")
    out.append(f"- Memory usage: {df.memory_usage(deep=True).sum() / (1024*1024):.2f} MB\n")

    out.append('\n### Column Names\n')
    out.append(', '.join(list(df.columns)) + '\n')

    out.append('### Dtypes\n')
    dtypes = column_type_overview(df)
    out.append('\n'.join(f"{k} {v}" for k,v in dtypes.items()) + '\n')

    out.append('### Missing Value Summary\n')
    out.append('| column | missing | missing_pct | empty_string | literal_null_text | non_null |')
    out.append('| --- | --- | --- | --- | --- | --- |')
    for c, miss, miss_pct, empty, lit_null, non_null in missing_summary(df):
        out.append(f"| {c} | {miss} | {miss_pct} | {empty} | {lit_null} | {non_null} |")

    id_cols = detect_id_columns(df)
    dt_cols = detect_datetime_columns(df)
    lat_cols, lon_cols = detect_latlon_columns(df)
    event_type = detect_event_type_columns(df)
    status_cols = detect_status_columns(df)
    priority_cols = detect_priority_columns(df)
    zone_cols = detect_zone_location_columns(df)

    out.append('\n### Auto-Identified Column Groups\n')
    out.append(f"- Id Columns: {', '.join(id_cols) if id_cols else 'none detected'}")
    out.append(f"- Datetime Columns: {', '.join(dt_cols) if dt_cols else 'none detected'}")
    out.append(f"- Latitude Columns: {', '.join(lat_cols) if lat_cols else 'none detected'}")
    out.append(f"- Longitude Columns: {', '.join(lon_cols) if lon_cols else 'none detected'}")
    out.append(f"- Event Type Columns: {', '.join(event_type) if event_type else 'none detected'}")
    out.append(f"- Status Columns: {', '.join(status_cols) if status_cols else 'none detected'}")
    out.append(f"- Priority Columns: {', '.join(priority_cols) if priority_cols else 'none detected'}")
    out.append(f"- Zone Junction Location Columns: {', '.join(zone_cols) if zone_cols else 'none detected'}")

    out.append('\n### Column Descriptions\n')
    for c in df.columns:
        info = describe_column(df, c)
        out.append(f"#### {c}\n")
        out.append(f"- dtype: {info.get('dtype')}\n- non-null: {info.get('non_null')}\n- unique: {info.get('unique')}")
        out.append('top values:')
        for k, v in (info.get('top') or {}).items():
            out.append(f" - {k}: {v}")
        out.append('\n')

    out.append('\n### First 5 Rows\n')
    out.append(df.head(5).to_string(index=False) + '\n')

    return '\n'.join(out)


def build_candidate_mappings(event_df, viol_df):
    mappings = []
    ev_map = [
        ('event_id', 'id'),
        ('event_type', next((c for c in event_df.columns if re.search(r'event_type|type', c, flags=re.I)), 'event_type')),
        ('latitude', next((c for c in event_df.columns if re.search(r'(^|_)lat|latitude', c, flags=re.I)), 'latitude')),
        ('longitude', next((c for c in event_df.columns if re.search(r'(^|_)lon|longitude|lng', c, flags=re.I)), 'longitude')),
        ('start_datetime', next((c for c in event_df.columns if re.search(r'start|created.*date|start_datetime', c, flags=re.I)), 'start_datetime')),
        ('end_datetime', next((c for c in event_df.columns if re.search(r'end|end_datetime', c, flags=re.I)), 'end_datetime')),
        ('status', next((c for c in event_df.columns if re.search(r'status', c, flags=re.I)), 'status')),
        ('priority', next((c for c in event_df.columns if re.search(r'priority', c, flags=re.I)), 'priority')),
        ('zone', next((c for c in event_df.columns if re.search(r'zone', c, flags=re.I)), 'zone')),
        ('junction', next((c for c in event_df.columns if re.search(r'junction', c, flags=re.I)), 'junction')),
    ]
    mappings.append(('Events', ev_map))

    vl_map = [
        ('violation_id', 'id'),
        ('latitude', next((c for c in viol_df.columns if re.search(r'(^|_)lat|latitude', c, flags=re.I)), 'latitude')),
        ('longitude', next((c for c in viol_df.columns if re.search(r'(^|_)lon|longitude|lng', c, flags=re.I)), 'longitude')),
        ('violation_type', next((c for c in viol_df.columns if re.search(r'violation|type', c, flags=re.I)), 'violation_type')),
        ('created_datetime', next((c for c in viol_df.columns if re.search(r'created|created_datetime', c, flags=re.I)), 'created_datetime')),
        ('validation_status', next((c for c in viol_df.columns if re.search(r'validation|status', c, flags=re.I)), 'validation_status')),
        ('junction_name', next((c for c in viol_df.columns if re.search(r'junction|junction_name', c, flags=re.I)), 'junction_name')),
        ('police_station', next((c for c in viol_df.columns if re.search(r'police|station', c, flags=re.I)), 'police_station')),
    ]
    mappings.append(('Violations', vl_map))
    return mappings


def generate_report(events_csv, violations_csv, out_path):
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    md = []
    md.append('# Gridlock Dataset Profile')
    md.append('Generated: ' + now)
    md.append('This report profiles the raw datasets for Phase 1 cleaning. No data was modified.')

    print('Loading', events_csv)
    ev = pd.read_csv(events_csv, low_memory=False)
    print('Loading', violations_csv)
    vl = pd.read_csv(violations_csv, low_memory=False)

    md.append(profile_dataframe(ev, events_csv))
    md.append(profile_dataframe(vl, violations_csv))

    md.append('## Candidate Feature Mappings')
    mappings = build_candidate_mappings(ev, vl)
    for name, maplist in mappings:
        md.append('### ' + name)
        md.append('| Phase 1 Target | Source Column | Notes |')
        md.append('| --- | --- | --- |')
        for tgt, src in maplist:
            md.append(f"| `{tgt}` | `{src}` | suggested |")

    with open(out_path, 'w', encoding='utf8') as f:
        f.write('\n\n'.join(md))

    print('Report written to', out_path)


def main():
    if not os.path.exists(RAW_EVENTS):
        print('Missing events file:', RAW_EVENTS, file=sys.stderr)
        sys.exit(2)
    if not os.path.exists(RAW_VIOLATIONS):
        print('Missing violations file:', RAW_VIOLATIONS, file=sys.stderr)
        sys.exit(2)
    os.makedirs(os.path.dirname(OUT_REPORT), exist_ok=True)
    generate_report(RAW_EVENTS, RAW_VIOLATIONS, OUT_REPORT)


if __name__ == '__main__':
    main()
