from pathlib import Path
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data/processed/events_clean.csv"
OUT_CSV = ROOT / "data/processed/events_model_ready.csv"
OUT_REPORT = ROOT.parent / "docs/modeling_dataset_report.md"


def summarize_duration(series: pd.Series):
    s = series.dropna().astype(float)
    res = {
        'count': int(s.count()),
        'mean': float(s.mean()) if s.count() else None,
        'median': float(s.median()) if s.count() else None,
        'std': float(s.std()) if s.count() else None,
        'min': float(s.min()) if s.count() else None,
        'max': float(s.max()) if s.count() else None,
        'percentiles': {p: float(s.quantile(p/100.0)) for p in (5,25,50,75,95)}
    }
    # simple histogram
    bins = [0,5,15,30,60,120,240,1440,2880]
    hist = pd.cut(s, bins=bins, right=False).value_counts().sort_index()
    res['histogram'] = {str(interval): int(count) for interval, count in hist.items()}
    return res


def main():
    print(f"Loading {INPUT}")
    df = pd.read_csv(INPUT, low_memory=False)
    original_rows = int(df.shape[0])

    # coerce to numeric
    dur = pd.to_numeric(df.get('event_duration_minutes'), errors='coerce')

    # apply filters
    mask_notnull = dur.notna()
    mask_ge0 = dur >= 0
    mask_le_max = dur <= 2880  # 48 hours
    final_mask = mask_notnull & mask_ge0 & mask_le_max

    retained_df = df.loc[final_mask].copy()
    retained_rows = int(retained_df.shape[0])
    dropped_rows = original_rows - retained_rows

    # write CSV
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    retained_df.to_csv(OUT_CSV, index=False)
    print(f"Wrote model-ready CSV: {OUT_CSV} (rows: {retained_rows})")

    # create report
    dur_summary_all = summarize_duration(dur)
    dur_summary_retained = summarize_duration(pd.to_numeric(retained_df.get('event_duration_minutes'), errors='coerce'))

    lines = []
    lines.append("# Modeling Dataset Report")
    lines.append("")
    lines.append(f"Source file: {INPUT}")
    lines.append("")
    lines.append(f"- Original row count: {original_rows}")
    lines.append(f"- Retained row count: {retained_rows}")
    lines.append(f"- Dropped row count: {dropped_rows}")
    lines.append("")
    lines.append("## Duration distribution (all rows)")
    lines.append("")
    for k,v in dur_summary_all.items():
        if k == 'histogram':
            lines.append("### Histogram (minutes) - all rows")
            for b,c in v.items():
                lines.append(f"- {b}: {c}")
        elif k == 'percentiles':
            lines.append(f"- Percentiles: {v}")
        else:
            lines.append(f"- {k}: {v}")
    lines.append("")
    lines.append("## Duration distribution (retained rows)")
    lines.append("")
    for k,v in dur_summary_retained.items():
        if k == 'histogram':
            lines.append("### Histogram (minutes) - retained rows")
            for b,c in v.items():
                lines.append(f"- {b}: {c}")
        elif k == 'percentiles':
            lines.append(f"- Percentiles: {v}")
        else:
            lines.append(f"- {k}: {v}")

    lines.append("")
    lines.append("## Notes")
    lines.append("")
    lines.append("- Filtering kept only rows with non-null `event_duration_minutes` in [0, 2880] minutes.")
    lines.append("- No feature engineering performed; this dataset is intended to provide a clean target column for modeling.")

    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text("\n".join(lines), encoding='utf-8')
    print(f"Wrote report: {OUT_REPORT}")


if __name__ == '__main__':
    main()
