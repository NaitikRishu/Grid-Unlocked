#!/usr/bin/env python3
import os
import pickle
import pandas as pd
import numpy as np
from xgboost import XGBRegressor, XGBClassifier
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, f1_score, precision_score, recall_score

def main():
    src_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.dirname(src_dir)
    
    fm_path = os.path.join(ml_dir, 'data', 'processed', 'feature_matrix.csv')
    events_path = os.path.join(ml_dir, 'data', 'processed', 'events_clean.csv')
    
    fm = pd.read_csv(fm_path)
    events = pd.read_csv(events_path)[['id', 'start_datetime']]
    events.rename(columns={'id': 'event_id'}, inplace=True)
    
    fm = fm.merge(events, on='event_id')
    
    # Sort by start_datetime ascending
    fm['start_datetime'] = pd.to_datetime(fm['start_datetime'], utc=True)
    fm.sort_values('start_datetime', inplace=True)
    
    # Train/test split at 80% row index
    split_idx = int(len(fm) * 0.8)
    train = fm.iloc[:split_idx]
    test = fm.iloc[split_idx:]
    
    print(f"Train rows: {len(train)}")
    print(f"Test rows: {len(test)}")
    
    drop_cols = ['congestion_score', 'high_impact', 'event_id', 'zone_id', 'start_datetime']
    # end_datetime is not in feature_matrix, but just in case
    if 'end_datetime' in train.columns:
        drop_cols.append('end_datetime')
        
    X_train = train.drop(columns=[c for c in drop_cols if c in train.columns])
    y_train_reg = train['congestion_score']
    y_train_cls = train['high_impact']
    
    X_test = test.drop(columns=[c for c in drop_cols if c in test.columns])
    y_test_reg = test['congestion_score']
    y_test_cls = test['high_impact']
    
    print("\nTraining XGBRegressor...")
    regressor = XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.05, subsample=0.8)
    regressor.fit(X_train, y_train_reg)
    y_pred_reg = regressor.predict(X_test)
    
    rmse = np.sqrt(mean_squared_error(y_test_reg, y_pred_reg))
    mae = mean_absolute_error(y_test_reg, y_pred_reg)
    r2 = r2_score(y_test_reg, y_pred_reg)
    
    print(f"Regression Metrics: RMSE={rmse:.3f}, MAE={mae:.3f}, R2={r2:.3f}")
    
    print("\nTraining XGBClassifier...")
    classifier = XGBClassifier(n_estimators=200, max_depth=5, learning_rate=0.05, scale_pos_weight=3)
    classifier.fit(X_train, y_train_cls)
    y_pred_cls = classifier.predict(X_test)
    
    precision = precision_score(y_test_cls, y_pred_cls, zero_division=0)
    recall = recall_score(y_test_cls, y_pred_cls, zero_division=0)
    f1 = f1_score(y_test_cls, y_pred_cls, zero_division=0)
    
    print(f"Classifier Metrics: Precision={precision:.3f}, Recall={recall:.3f}, F1={f1:.3f}")
    
    print("\nTop 10 Feature Importances (Regressor):")
    fi_reg = pd.Series(regressor.feature_importances_, index=X_train.columns).sort_values(ascending=False).head(10)
    print(fi_reg)
    
    print("\nTop 10 Feature Importances (Classifier):")
    fi_cls = pd.Series(classifier.feature_importances_, index=X_train.columns).sort_values(ascending=False).head(10)
    print(fi_cls)
    
    models_dir = os.path.join(ml_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    with open(os.path.join(models_dir, 'congestion_model.pkl'), 'wb') as f:
        pickle.dump(regressor, f)
    with open(os.path.join(models_dir, 'impact_classifier.pkl'), 'wb') as f:
        pickle.dump(classifier, f)
    with open(os.path.join(models_dir, 'feature_cols.pkl'), 'wb') as f:
        pickle.dump(list(X_train.columns), f)
        
    print("\nModels saved successfully.")

if __name__ == '__main__':
    main()
