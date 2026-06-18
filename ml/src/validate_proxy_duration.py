import pandas as pd
import numpy as np
from pathlib import Path

def main():
    root_dir = Path(__file__).resolve().parents[2]
    input_csv = root_dir / 'ml' / 'data' / 'processed' / 'events_clean.csv'
    output_md = root_dir / 'docs' / 'proxy_duration_validation.md'

    # Load data
    df = pd.read_csv(input_csv, low_memory=False)

    # 1. Select rows where start, closed, and modified exist
    for col in ['start_datetime', 'closed_datetime', 'modified_datetime']:
        df[col] = pd.to_datetime(df[col], errors='coerce')

    mask = df['start_datetime'].notna() & df['closed_datetime'].notna() & df['modified_datetime'].notna()
    df_valid = df[mask].copy()

    # 2. Compute durations
    df_valid['true_duration'] = (df_valid['closed_datetime'] - df_valid['start_datetime']).dt.total_seconds() / 60.0
    df_valid['proxy_duration'] = (df_valid['modified_datetime'] - df_valid['start_datetime']).dt.total_seconds() / 60.0

    # 3. Report metrics
    row_count = len(df_valid)
    
    pearson_corr = df_valid['true_duration'].corr(df_valid['proxy_duration'], method='pearson')
    spearman_corr = df_valid['true_duration'].corr(df_valid['proxy_duration'], method='spearman')
    
    absolute_error = (df_valid['true_duration'] - df_valid['proxy_duration']).abs()
    mae = absolute_error.mean()
    median_ae = absolute_error.median()
    p95_ae = absolute_error.quantile(0.95)

    # 5. Conclude
    if median_ae < 15 and spearman_corr > 0.8:
        conclusion_answer = "Yes"
        conclusion_text = "The proxy duration demonstrates strong correlation and a very low median absolute error, making it a highly reliable and statistically valid proxy for modeling event completion time."
    elif median_ae < 60 and spearman_corr > 0.6:
        conclusion_answer = "Yes, with caveats"
        conclusion_text = "The proxy is acceptable. While the mean error might be skewed by outliers, the median absolute error and correlation are reasonable enough to salvage data, though some temporal noise will be introduced into the model."
    else:
        conclusion_answer = "No"
        conclusion_text = "The absolute error is too high and correlation too weak to safely use `modified_datetime` as a direct proxy for completion time without significantly distorting the target variable."

    # 4. Generate markdown
    md_content = f"""# Proxy Duration Validation

## Objective
Evaluate whether `modified_datetime` is a statistically valid proxy for event completion when `closed_datetime` is missing.

## Analysis Metrics
- **Row count evaluated:** {row_count}
- **Pearson correlation:** {pearson_corr:.4f}
- **Spearman correlation:** {spearman_corr:.4f}
- **Mean Absolute Error (MAE):** {mae:.2f} minutes
- **Median Absolute Error:** {median_ae:.2f} minutes
- **P95 Absolute Error:** {p95_ae:.2f} minutes

## Conclusion
**Is `modified_datetime` a sufficiently accurate proxy for modeling event duration?**

**Verdict: {conclusion_answer}**

{conclusion_text}
"""

    output_md.parent.mkdir(parents=True, exist_ok=True)
    with open(output_md, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"Validation complete. Report written to {output_md}")

if __name__ == '__main__':
    main()
