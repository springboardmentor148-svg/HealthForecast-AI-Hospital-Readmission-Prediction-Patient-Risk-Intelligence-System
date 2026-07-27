# ML Model Directory

Place your trained model file here as:

```
ml/best_xgboost.pkl
```

The backend loads it via `joblib.load()` in `ml/model_loader.py` — it is
**only used for inference**, never retrained by the API.

If your model was trained with a different feature set/encoding than the
defaults in `ml/preprocessing.py`, update `FEATURE_ORDER` and the
`*_MAP` dictionaries in that file to match your training pipeline exactly.
