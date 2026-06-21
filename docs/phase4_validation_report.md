# Phase 4 Validation Report

## 1. Feature Matrix Audit
- **Total Rows**: 8,136
- **Duplicate event_id**: 0
- **Target Leakage Note**: `historical_avg_duration` is technically calculated across the entire dataset (which may introduce some leakage of future durations into past predictions), but this was preserved exactly as mathematically specified in the Phase 3 `workplan.txt` instructions. No other target leakages were identified.
- **Target Distribution (`high_impact`)**: 
  - 0 (Low Impact): 84.56%
  - 1 (High Impact): 15.44%
  *(Class balance is adequate; however, `scale_pos_weight=3` was applied to the XGBClassifier to penalize false negatives for the minority class).*

## 2. Train/Test Splits
- **Strategy**: Time-based chronological split (80/20) sorting by `start_datetime`.
- **Training Set Row Count**: 6,508
- **Testing Set Row Count**: 1,628

## 3. Evaluation Metrics
### XGBRegressor (`congestion_score`)
- **RMSE**: 32.617
- **MAE**: 23.399
- **R² Score**: 0.158

### XGBClassifier (`high_impact`)
- **Precision**: 0.442
- **Recall**: 0.449
- **F1 Score**: 0.445

*(Note: Traffic congestion duration is inherently highly variable with these available features, leading to modest R² and F1 scores. The models correctly captured baseline spatial and temporal patterns but struggle with exact outlier predictability, which is expected for this domain).*

## 4. Top 10 Feature Importances
**Regressor:**
1. `concurrent_events_in_zone` (0.354)
2. `event_type_planned` (0.233)
3. `historical_avg_duration` (0.077)
4. `priority_encoded` (0.054)
5. `response_lag_minutes` (0.052)
6. `month` (0.050)
7. `is_peak_hour` (0.048)
8. `day_of_week` (0.045)
9. `hour_of_day` (0.044)
10. `requires_road_closure` (0.040)

**Classifier:**
1. `concurrent_events_in_zone` (0.498)
2. `event_type_planned` (0.096)
3. `historical_avg_duration` (0.068)
4. `month` (0.056)
5. `priority_encoded` (0.055)
6. `hour_of_day` (0.052)
7. `is_peak_hour` (0.048)
8. `response_lag_minutes` (0.047)
9. `day_of_week` (0.042)
10. `requires_road_closure` (0.033)

## 5. Model File Sizes
- `ml/models/congestion_model.pkl`: 836 KB
- `ml/models/impact_classifier.pkl`: 426 KB
- `ml/models/feature_cols.pkl`: 254 Bytes

## 6. API Validation
- **`GET /api/events`**: Replaced the dummy list with an actual JSON response returning the top 200 events from `events_clean.csv`.
- **`GET /api/events/:id`**: Replaced the dummy exception with a fully functional live inference route.
  - Successfully parses the event from `events_clean.csv`.
  - Dynamically extracts the pre-computed feature row from `feature_matrix.csv`.
  - Runs `predict_event()` using the serialized XGBoost models.
  - Correctly returns `{ event: {...}, prediction: {...}, predicted_score: float, actual_duration: float }`.
  - **Status:** Verified working with HTTP 200 OK via `uvicorn`.
