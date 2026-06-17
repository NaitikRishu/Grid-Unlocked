# ML Data Decisions & Final Readiness Review

## Executive Summary
This document consolidates findings from our data quality audits, technical reviews, and target salvage investigations. It serves as the definitive guide for the dataset to be used in Phase 3 feature engineering and modeling.

## 1. Target Loss Findings
Initial dataset parsing strictly used `closed_datetime` and `resolved_datetime` to calculate event durations. This strict approach dropped 5,533 rows out of 8,136 (68% data loss) because the target variable was null. Investigation revealed that 3,947 of these dropped rows were actually "closed" or "resolved" events that simply lacked a final explicit closure timestamp. 

## 2. Proxy Validation Findings
To prevent destroying valid training data, we investigated using `modified_datetime` as a proxy for the missing closure times. 
Validation metrics on a strictly bounded subset (3,120 rows where all timestamps existed) proved the proxy's validity:
- **Pearson correlation:** 0.9979
- **Spearman correlation:** 0.9968
- **Median Absolute Error:** 0.00 minutes
- **P95 Absolute Error:** 0.01 minutes

## 3. Final Duration Definition (Option B: Proxy Salvage)
We have adopted Option B for calculating event duration, prioritizing timestamps in the following cascade order:
1. `closed_datetime - start_datetime`
2. `modified_datetime - start_datetime` (Proxy Salvage)
3. `resolved_datetime - start_datetime`
4. `NaN`

Constraints applied: Duration must be between 0 and 2,880 minutes (48 hours).

## 4. Final Modeling Dataset Decision
The newly generated dataset is: `ml/data/processed/events_ml_ready.csv`

**Data Recovery Metrics:**
- **Original Unique Rows:** 8,136
- **Final ML-Ready Rows:** 7,368
- **Rows Recovered (vs baseline 2,603):** 4,765
- **Recovery Rate:** 90.56% of original unique rows are now usable for modeling.

**Validation Checks (events_ml_ready.csv):**
- **Duplicate IDs:** 0
- **Negative Durations:** 0
- **Durations > 2880:** 0

## 5. Known Risks Going Into Phase 3
* **Data Leakage Risk:** We must enforce strict temporal separation. Features like `requires_road_closure`, `priority`, `event_cause`, and `veh_type` may only be recorded *after* an incident is addressed. If these are included in the baseline predictive model (which estimates duration at incident *onset*), it will cause massive target leakage. Only fields deterministically known at reporting time (e.g., `event_type`, `latitude`, `longitude`, `start_datetime`) should be used.
* **Schema Mismatches:** Ensure Pydantic model attributes (`lat`, `lon` in `EventResponse`) map correctly to feature inputs (`latitude`, `longitude`) during API inference.

## 6. Document Archival Recommendations
The following preliminary investigation reports are now consolidated and redundant. They should be archived or deleted to reduce clutter:
* `docs/modeling_dataset_report.md`
* `docs/b_side_technical_review.md`
* `docs/target_salvage_verdict.md`
* `docs/proxy_duration_validation.md`
