#!/usr/bin/env python3
"""Inspect raw datasets and generate a markdown profiling report.

Writes: docs/dataset_profile.md (overwrites if exists)
Does not modify source CSVs.
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
#!/usr/bin/env python3
"""Inspect raw datasets and generate a markdown profiling report.

Writes: docs/dataset_profile.md (overwrites if exists)
Does not modify source CSVs.
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
    main()
                lines.append(f"- **{label}:** none detected")

        lines.extend(["", "### Column Descriptions", ""])
        for desc in descriptions:
            lines.append(f"#### `{desc['column']}`")
            lines.append("")
            lines.append(f"- **dtype:** `{desc['dtype']}`")
            lines.append(f"- **non-null:** {desc['non_null']:,}")
            lines.append(f"- **unique:** {desc['unique']:,}")
            if "min" in desc:
                lines.append(f"- **min:** {desc['min']}")
                lines.append(f"- **max:** {desc['max']}")
            if "mean" in desc and desc["mean"] is not None:
                lines.append(f"- **mean:** {desc['mean']}")
            if "top_values" in desc:
                lines.append("- **top values:**")
                for value, count in desc["top_values"].items():
                    lines.append(f"  - `{value}`: {count:,}")
            lines.append("")

        lines.extend(["### Candidate Feature Mappings", ""])
        lines.append("| Phase 1 Target | Source Column | Notes |")
        lines.append("| --- | --- | --- |")
        for target, source, notes in mappings:
            lines.append(f"| `{target}` | `{source}` | {notes} |")
        lines.append("")

        lines.extend(["### First 5 Rows", ""])
        sample = df.head(5).fillna("NULL")
        lines.append("```")
        lines.append(sample.to_string())
        lines.append("```")
        lines.append("")

    lines.extend(
        [
            "## Recommended Mapping to Phase 1 Pipeline",
            "",
            "### Events (`ml/src/clean_events.py`)",
            "",
            "| Target Field | Source Column | Cleaning Action |",
            "| --- | --- | --- |",
            "| `event_id` | `id` | Drop duplicate rows on this column |",
            "| `event_type` | `event_type` | Lowercase and strip |",
            "| `latitude` | `latitude` | Drop null; keep [12.7, 13.2] |",
            "| `longitude` | `longitude` | Drop null; keep [77.4, 77.8] |",
            "| `start_datetime` | `start_datetime` | Parse to datetime |",
            "| `end_datetime` | `end_datetime` | Parse to datetime |",
            "| `closed_datetime` | `closed_datetime` | Parse to datetime |",
            "| `created_date` | `created_date` | Parse to datetime |",
            "| `status` | `status` | Lowercase and strip |",
            "| `priority` | `priority` | Lowercase and strip |",
            "| `zone` | `zone` | Preserve for Phase 2 spatial join |",
            "| `junction` | `junction` | Preserve for violation density joins |",
            "| `corridor` | `corridor` | Preserve as categorical feature |",
            "| `requires_road_closure` | `requires_road_closure` | Cast to boolean/binary |",
            "| `event_duration_minutes` | derived | `(closed_datetime - start_datetime)` in minutes |",
            "| `response_lag_minutes` | derived | `(start_datetime - created_date)` in minutes |",
            "",
            "### Violations (`ml/src/clean_violations.py`)",
            "",
            "| Target Field | Source Column | Cleaning Action |",
            "| --- | --- | --- |",
            "| `violation_id` | `id` | Drop duplicate rows on this column |",
            "| `latitude` | `latitude` | Drop null; keep [12.7, 13.2] |",
            "| `longitude` | `longitude` | Drop null; keep [77.4, 77.8] |",
            "| `violation_type` | `violation_type` | Lowercase and strip; handle list-like strings |",
            "| `created_datetime` | `created_datetime` | Parse to datetime |",
            "| `closed_datetime` | `closed_datetime` | Parse to datetime |",
            "| `modified_datetime` | `modified_datetime` | Parse to datetime |",
            "| `validation_status` | `validation_status` | Lowercase and strip |",
            "| `junction_name` | `junction_name` | Preserve for density features |",
            "| `police_station` | `police_station` | Preserve for reporting |",
            "| `violation_duration_minutes` | derived | `(closed_datetime - created_datetime)` in minutes |",
            "",
            "## Phase 1 Observations",
            "",
            "- Both datasets already use snake_case column names aligned with the planned pipeline.",
            "- Events contain rich operational metadata; only a subset is required for Phase 1 cleaning.",
            "- Violations `violation_type` appears to store JSON-like list strings and will need parsing/normalization later.",
            "- Several datetime fields are sparse or null-heavy; duration features should tolerate missing closures.",
            "- Spatial filtering should use Bengaluru bounds before downstream graph snapping in Phase 2.",
            "",
        ]
    )

    return "\n".join(lines)


def main() -> None:
    profiles: dict[str, dict[str, Any]] = {}

    for name, path in DATASETS.items():
        df = load_dataset(name, path)
        categories = classify_columns(df)
        print_profile(name, df, categories)

        profiles[name] = {
            "path": path.relative_to(ROOT),
            "df": df,
            "categories": categories,
            "missing": missing_summary(df),
            "descriptions": column_descriptions(df),
            "mappings": recommend_mappings(name, df, categories),
            "memory_mb": df.memory_usage(deep=True).sum() / (1024 * 1024),
        }

    report = build_report(profiles)
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"\nReport saved to: {REPORT_PATH}")


if __name__ == "__main__":
    main()
