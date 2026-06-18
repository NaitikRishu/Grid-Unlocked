# Data Quality Audit

## Events (ml/data/processed/events_clean.csv)

- Rows: 8136
- Columns: 48
- Duplicate `id` count: 0

### Datetime parsing failures
- start_datetime: 115 parse failures
- end_datetime: 7662 parse failures
- modified_datetime: 0 parse failures
- created_date: 1 parse failures
- closed_datetime: 5004 parse failures
- resolved_datetime: 8065 parse failures

### Coordinate ranges
- latitude: min=12.8010411, max=13.1988858
- longitude: min=77.4235747, max=77.76940255
- Null coordinate values (sum lat+lon nulls): 0

### Event duration (`event_duration_minutes`) distribution
- Count non-null: 3185
- Mean: 6242.61897257751
- Median: 64.40976768333333
- Std: 20365.23944558978
- Min: -1360.1622529166666, Max: 201789.4924975
- Percentiles: {5: 7.9526671066666665, 25: 27.996742333333337, 50: 64.40976768333333, 75: 329.12024915, 95: 38585.38979395318}

Histogram buckets (minutes):
- [0, 5): 90
- [5, 15): 292
- [15, 30): 464
- [30, 60): 648
- [60, 120): 677
- [120, 240): 186
- [240, 1440): 158

### Top event types
- unplanned: 7669
- planned: 467

---

## Violations (ml/data/processed/violations_clean.csv)

- Rows: 298282
- Columns: 24
- Duplicate `id` count (within chunks): 0

### Datetime parsing failures
- created_datetime: 5 parse failures
- closed_datetime: 298282 parse failures
- modified_datetime: 0 parse failures
- action_taken_timestamp: 298282 parse failures
- data_sent_to_scita_timestamp: 256146 parse failures
- updated_vehicle_number: 298282 parse failures
- updated_vehicle_type: 298282 parse failures
- validation_timestamp: 125332 parse failures

### Coordinate ranges
- latitude: min=12.8026667, max=13.1999178
- longitude: min=77.442553, max=77.771735

### Top violation types
- ["wrong parking"]: 138724
- ["no parking"]: 119482
- ["parking in a main road","wrong parking"]: 9468
- ["parking in a main road","no parking"]: 4810
- ["wrong parking","defective number plate"]: 3315
- ["no parking","parking in a main road"]: 2447
- ["no parking","defective number plate"]: 2378
- ["wrong parking","parking in a main road"]: 1955
- ["parking on footpath","wrong parking"]: 1190
- ["no parking","wrong parking"]: 891
- ["parking in a main road","wrong parking","no parking"]: 863
- ["wrong parking","no parking"]: 822
- ["parking on footpath","no parking"]: 682
- ["no parking","wrong parking","parking in a main road"]: 675
- ["wrong parking","parking on footpath"]: 466
- ["no parking","parking near bustop/school/hospital etc"]: 385
- ["defective number plate","wrong parking"]: 380
- ["no parking","double parking"]: 367
- ["no parking","parking on footpath"]: 344
- ["wrong parking","refuse to go for hire"]: 329
