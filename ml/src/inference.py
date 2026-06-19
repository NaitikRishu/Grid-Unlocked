#!/usr/bin/env python3
import os
import pickle
import pandas as pd
import numpy as np

_regressor = None
_classifier = None
_feature_cols = None

def load_models():
    global _regressor, _classifier, _feature_cols
    if _regressor is not None:
        return _regressor, _classifier
        
    src_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.dirname(src_dir)
    models_dir = os.path.join(ml_dir, 'models')
    
    with open(os.path.join(models_dir, 'congestion_model.pkl'), 'rb') as f:
        _regressor = pickle.load(f)
    with open(os.path.join(models_dir, 'impact_classifier.pkl'), 'rb') as f:
        _classifier = pickle.load(f)
    with open(os.path.join(models_dir, 'feature_cols.pkl'), 'rb') as f:
        _feature_cols = pickle.load(f)
        
    return _regressor, _classifier

def predict_event(event_dict):
    load_models()
    
    # Event dict might be raw or pre-computed. We map available keys to required features.
    df = pd.DataFrame([event_dict])
    for col in _feature_cols:
        if col not in df.columns:
            df[col] = 0
            
    # Reorder columns to match training exactly
    X = df[_feature_cols]
    
    score = _regressor.predict(X)[0]
    score = float(np.clip(score, 0, 100))
    
    is_high_impact = bool(_classifier.predict(X)[0])
    
    # get probability of class 1
    proba = _classifier.predict_proba(X)[0]
    high_impact_prob = float(proba[1]) if len(proba) > 1 else float(is_high_impact)
    
    return {
        "congestion_score": score,
        "high_impact": is_high_impact,
        "high_impact_probability": high_impact_prob
    }

def predict_batch(events_list):
    return [predict_event(e) for e in events_list]
