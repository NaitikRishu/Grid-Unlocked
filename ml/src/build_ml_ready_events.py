import pandas as pd
import numpy as np
from pathlib import Path

def main():
    root_dir = Path(__file__).resolve().parents[2]
    input_csv = root_dir / 'ml' / 'data' / 'processed' / 'events_clean.csv'
    output_csv = root_dir / 'ml' / 'data' / 'processed' / 'events_ml_ready.csv'

    print(f"Loading {input_csv}")
    df = pd.read_csv(input_csv, low_memory=False)

    # Remove duplicate ids
    if 'id' in df.columns:
        df = df.drop_duplicates(subset=['id']).copy()

    # Ensure datetimes are parsed
    dt_cols = ['start_datetime', 'closed_datetime', 'modified_datetime', 'resolved_datetime']
    for col in dt_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')

    # Apply Duration logic
    def get_duration(row):
        start = row.get('start_datetime')
        if pd.isna(start):
            return np.nan
        
        closed = row.get('closed_datetime')
        if pd.notna(closed):
            return (closed - start).total_seconds() / 60.0
            
        modified = row.get('modified_datetime')
        if pd.notna(modified):
            return (modified - start).total_seconds() / 60.0
            
        resolved = row.get('resolved_datetime')
        if pd.notna(resolved):
            return (resolved - start).total_seconds() / 60.0
            
        return np.nan

    df['ml_duration_minutes'] = df.apply(get_duration, axis=1)

    # Apply constraints
    mask = df['ml_duration_minutes'].notna() & (df['ml_duration_minutes'] >= 0) & (df['ml_duration_minutes'] <= 2880)
    final_df = df[mask].copy()

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    final_df.to_csv(output_csv, index=False)
    
    print(f"Original unique rows: {len(df)}")
    print(f"Final ML-ready rows: {len(final_df)}")
    print(f"Rows recovered vs baseline (2603): {len(final_df) - 2603}")
    print(f"Recovery rate vs original rows: {(len(final_df) / len(df)) * 100:.2f}%")
    print(f"Wrote to {output_csv}")

if __name__ == '__main__':
    main()
