import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVENTS = ROOT / "data/processed/events_clean.csv"
VIOLATIONS = ROOT / "data/processed/violations_clean.csv"
OUT = ROOT.parent / "docs/data_quality_audit.md"


def detect_datetime_columns(df):
    cols = [c for c in df.columns if any(k in c.lower() for k in ("date", "datetime", "time"))]
    return cols


def detect_coord_columns(df):
    lat_candidates = [c for c in df.columns if "lat" in c.lower()]
    lon_candidates = [c for c in df.columns if "lon" in c.lower()]
    # prefer exact names
    lat = None
    lon = None
    for pref in ("latitude", "lat"):
        for c in lat_candidates:
            if pref in c.lower():
                lat = c
                break
        if lat:
            break
    for pref in ("longitude", "lon", "long"):
        for c in lon_candidates:
            if pref in c.lower():
                lon = c
                break
        if lon:
            break
    return lat, lon


def analyze_df(df, name):
    out = {}
    out['rows'] = int(df.shape[0])
    out['cols'] = int(df.shape[1])
    # id dupes
    if 'id' in df.columns:
        out['dupe_count'] = int(df['id'].duplicated().sum())
    else:
        out['dupe_count'] = None
    # datetime parse failures
    dt_cols = detect_datetime_columns(df)
    dt_failures = {}
    for c in dt_cols:
        parsed = pd.to_datetime(df[c], errors='coerce', utc=True)
        dt_failures[c] = int(parsed.isna().sum())
    out['datetime_columns'] = dt_cols
    out['datetime_parse_failures'] = dt_failures
    # coords
    lat_col, lon_col = detect_coord_columns(df)
    out['lat_col'] = lat_col
    out['lon_col'] = lon_col
    if lat_col and lon_col:
        lat = pd.to_numeric(df[lat_col], errors='coerce')
        lon = pd.to_numeric(df[lon_col], errors='coerce')
        out['lat_min'] = float(lat.min(skipna=True)) if lat.notna().any() else None
        out['lat_max'] = float(lat.max(skipna=True)) if lat.notna().any() else None
        out['lon_min'] = float(lon.min(skipna=True)) if lon.notna().any() else None
        out['lon_max'] = float(lon.max(skipna=True)) if lon.notna().any() else None
        out['coord_nulls'] = int(pd.isna(lat).sum() + pd.isna(lon).sum())
    else:
        out['lat_min'] = out['lat_max'] = out['lon_min'] = out['lon_max'] = out['coord_nulls'] = None
    # simple top values
    out['top_values'] = {}
    for col in ['event_type', 'violation_type', 'type', 'status']:
        if col in df.columns:
            out['top_values'][col] = df[col].fillna('').value_counts().head(10).to_dict()
    return out


def analyze_events(df):
    res = analyze_df(df, 'events')
    # event_duration_minutes distribution
    if 'event_duration_minutes' in df.columns:
        dur = pd.to_numeric(df['event_duration_minutes'], errors='coerce')
        stats = {}
        stats['count_nonnull'] = int(dur.notna().sum())
        stats['mean'] = float(dur.mean(skipna=True)) if dur.notna().any() else None
        stats['median'] = float(dur.median(skipna=True)) if dur.notna().any() else None
        stats['std'] = float(dur.std(skipna=True)) if dur.notna().any() else None
        stats['min'] = float(dur.min(skipna=True)) if dur.notna().any() else None
        stats['max'] = float(dur.max(skipna=True)) if dur.notna().any() else None
        stats['percentiles'] = {p: float(dur.quantile(p/100.0)) for p in (5,25,50,75,95)}
        # histogram bins
        bins = [0,5,15,30,60,120,240,1440]
        hist = pd.cut(dur.dropna(), bins=bins, right=False).value_counts().sort_index()
        stats['histogram'] = {str(interval): int(count) for interval, count in hist.items()}
        res['event_duration_stats'] = stats
    else:
        res['event_duration_stats'] = None
    # top event types
    if 'event_type' in df.columns:
        res['top_event_types'] = df['event_type'].fillna('').value_counts().head(20).to_dict()
    else:
        res['top_event_types'] = {}
    return res


def analyze_violations_stream(path):
    # stream-read large violations file to compute top violation types without loading all in memory
    top_col = None
    type_counts = {}
    rows = 0
    cols = None
    dupe_count = 0
    id_seen = set()
    datetime_failures = {}
    lat_col = lon_col = None
    lat_min = lon_min = None
    lat_max = lon_max = None

    for chunk in pd.read_csv(path, chunksize=200000, low_memory=False):
        if cols is None:
            cols = chunk.shape[1]
            if 'id' in chunk.columns:
                dupe_count += int(chunk['id'].duplicated().sum())
        rows += chunk.shape[0]
        # detect type column
        if top_col is None:
            for candidate in ('violation_type', 'type', 'violation'):
                if candidate in chunk.columns:
                    top_col = candidate
                    break
        if top_col:
            vc = chunk[top_col].fillna('').value_counts()
            for k,v in vc.to_dict().items():
                type_counts[k] = type_counts.get(k,0) + int(v)
        # datetimes
        dt_cols = detect_datetime_columns(chunk)
        for c in dt_cols:
            parsed = pd.to_datetime(chunk[c], errors='coerce', utc=True)
            datetime_failures[c] = datetime_failures.get(c,0) + int(parsed.isna().sum())
        # coords
        if lat_col is None or lon_col is None:
            l, lo = detect_coord_columns(chunk)
            if l:
                lat_col = l
            if lo:
                lon_col = lo
        if lat_col and lon_col:
            lat = pd.to_numeric(chunk[lat_col], errors='coerce')
            lon = pd.to_numeric(chunk[lon_col], errors='coerce')
            if lat.notna().any():
                lat_min = float(np.nanmin([v for v in [lat_min, lat.min(skipna=True)] if v is not None])) if lat_min is not None else float(lat.min(skipna=True))
                lat_max = float(np.nanmax([v for v in [lat_max, lat.max(skipna=True)] if v is not None])) if lat_max is not None else float(lat.max(skipna=True))
            if lon.notna().any():
                lon_min = float(np.nanmin([v for v in [lon_min, lon.min(skipna=True)] if v is not None])) if lon_min is not None else float(lon.min(skipna=True))
                lon_max = float(np.nanmax([v for v in [lon_max, lon.max(skipna=True)] if v is not None])) if lon_max is not None else float(lon.max(skipna=True))
    result = {
        'rows': int(rows),
        'cols': int(cols) if cols is not None else None,
        'dupe_count': int(dupe_count),
        'datetime_parse_failures': datetime_failures,
        'lat_col': lat_col,
        'lon_col': lon_col,
        'lat_min': lat_min,
        'lat_max': lat_max,
        'lon_min': lon_min,
        'lon_max': lon_max,
        'top_violation_types': dict(sorted(type_counts.items(), key=lambda x: -x[1])[:20])
    }
    return result


def write_report(events_res, violations_res):
    lines = []
    lines.append("# Data Quality Audit")
    lines.append("")
    lines.append("## Events (ml/data/processed/events_clean.csv)")
    lines.append("")
    lines.append(f"- Rows: {events_res['rows']}")
    lines.append(f"- Columns: {events_res['cols']}")
    lines.append(f"- Duplicate `id` count: {events_res['dupe_count']}")
    lines.append("")
    lines.append("### Datetime parsing failures")
    if events_res['datetime_parse_failures']:
        for c, v in events_res['datetime_parse_failures'].items():
            lines.append(f"- {c}: {v} parse failures")
    else:
        lines.append("- none detected")
    lines.append("")
    lines.append("### Coordinate ranges")
    if events_res['lat_col'] and events_res['lon_col']:
        lines.append(f"- {events_res['lat_col']}: min={events_res['lat_min']}, max={events_res['lat_max']}")
        lines.append(f"- {events_res['lon_col']}: min={events_res['lon_min']}, max={events_res['lon_max']}")
        lines.append(f"- Null coordinate values (sum lat+lon nulls): {events_res['coord_nulls']}")
    else:
        lines.append("- coordinates not found")
    lines.append("")
    lines.append("### Event duration (`event_duration_minutes`) distribution")
    if events_res.get('event_duration_stats'):
        s = events_res['event_duration_stats']
        lines.append(f"- Count non-null: {s['count_nonnull']}")
        lines.append(f"- Mean: {s['mean']}")
        lines.append(f"- Median: {s['median']}")
        lines.append(f"- Std: {s['std']}")
        lines.append(f"- Min: {s['min']}, Max: {s['max']}")
        lines.append(f"- Percentiles: {s['percentiles']}")
        lines.append("")
        lines.append("Histogram buckets (minutes):")
        for b, cnt in s['histogram'].items():
            lines.append(f"- {b}: {cnt}")
    else:
        lines.append("- `event_duration_minutes` not present")
    lines.append("")
    lines.append("### Top event types")
    for et, cnt in events_res.get('top_event_types', {}).items():
        lines.append(f"- {et}: {cnt}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Violations (ml/data/processed/violations_clean.csv)")
    lines.append("")
    lines.append(f"- Rows: {violations_res['rows']}")
    lines.append(f"- Columns: {violations_res['cols']}")
    lines.append(f"- Duplicate `id` count (within chunks): {violations_res['dupe_count']}")
    lines.append("")
    lines.append("### Datetime parsing failures")
    if violations_res['datetime_parse_failures']:
        for c, v in violations_res['datetime_parse_failures'].items():
            lines.append(f"- {c}: {v} parse failures")
    else:
        lines.append("- none detected")
    lines.append("")
    lines.append("### Coordinate ranges")
    if violations_res['lat_col'] and violations_res['lon_col']:
        lines.append(f"- {violations_res['lat_col']}: min={violations_res['lat_min']}, max={violations_res['lat_max']}")
        lines.append(f"- {violations_res['lon_col']}: min={violations_res['lon_min']}, max={violations_res['lon_max']}")
    else:
        lines.append("- coordinates not found")
    lines.append("")
    lines.append("### Top violation types")
    for vt, cnt in violations_res.get('top_violation_types', {}).items():
        lines.append(f"- {vt}: {cnt}")
    lines.append("")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding='utf-8')
    print(f"Wrote audit to {OUT}")


if __name__ == '__main__':
    # events small -> load fully
    events_df = pd.read_csv(EVENTS, low_memory=False)
    events_res = analyze_events(events_df)
    # violations -> stream
    violations_res = analyze_violations_stream(VIOLATIONS)
    write_report(events_res, violations_res)
