# Model Deployment Guide

This guide explains how to deploy the trained PyTorch model to the backend server.

## Prerequisites

1. **Trained Model**: Complete the training pipeline in `apps/training/`
2. **Model Artifacts**: Ensure you have:
   - `model.pt` - Model checkpoint
   - `model_metadata.json` - Model configuration
   - `calibration.json` - Calibration parameters (optional but recommended)

## Deployment Steps

### Step 1: Export Model from Training

```bash
cd apps/training

# Ensure you have completed training and calibration
python train.py --epochs 30
python calibrate.py
python export.py

# Verify artifacts are created
ls artifacts/
# Should see: model.pt, model_metadata.json, class_names.json
```

### Step 2: Copy Artifacts to Server

```bash
# From training directory
cp artifacts/model.pt ../server/data/models/
cp artifacts/model_metadata.json ../server/data/models/

# Verify files are in place
ls ../server/data/models/
# Should see: model.pt, model_metadata.json
```

### Step 3: Install PyTorch Dependencies

```bash
cd apps/server

# Add to requirements.txt if not already present:
# torch>=2.1.0
# torchvision>=0.16.0
# pillow>=10.0.0

pip install torch torchvision pillow
```

### Step 4: Start Server

```bash
# From server directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected startup logs:**
```
INFO - Attempting to initialize PyTorch inference service...
INFO - Loading model metadata from .../data/models/model_metadata.json
INFO - Using device: cuda  # or cpu
INFO - Loading model from .../data/models/model.pt
INFO - Model loaded successfully: efficientnetv2-s
INFO - Number of classes: 6
INFO - Class names: ['Aloe Rot', 'Aloe Rust', 'Anthracnose', 'Healthy', 'Leaf Spot', 'Sunburn']
INFO - Using temperature scaling: 1.2345
INFO - PyTorch inference service initialized successfully
INFO - ✓ Using PyTorch inference service
```

### Step 5: Test Inference

```bash
# Test model_info endpoint
curl http://localhost:8000/api/v1/model_info

# Test prediction (replace with real image path)
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "image1=@test_healthy.jpg" \
  -F "image2=@test_healthy2.jpg" \
  -F "image3=@test_healthy3.jpg"
```

**Expected response structure:**
```json
{
  "predictions": [
    {
      "disease_id": "healthy",
      "disease_name": "Healthy",
      "confidence": 0.92,
      "description": "...",
      "severity": "none",
      "common_symptoms": [...]
    },
    ...
  ],
  "top_prediction": {
    "disease_id": "healthy",
    "disease_name": "Healthy",
    "confidence": 0.92
  },
  "confidence_level": "HIGH",
  "confidence_status": "HIGH",
  "recommended_next_step": "SHOW_TREATMENT",
  "retake_message": null,
  "num_images": 3,
  "symptoms_summary": "..."
}
```

## Fallback Behavior

If model files are not found, the server automatically falls back to the placeholder service:

```
WARNING - Model files not found at .../data/models
WARNING - Failed to initialize PyTorch service: Model files not found
INFO - ✓ Using placeholder inference service
```

This allows development to continue even without a trained model.

## Model Info Endpoint

Get model metadata and configuration:

```bash
curl http://localhost:8000/api/v1/model_info
```

**Response:**
```json
{
  "status": "success",
  "model": {
    "model_type": "pytorch",
    "model_name": "efficientnetv2-s",
    "model_architecture": "EfficientNetV2-S",
    "num_classes": 6,
    "class_names": ["Aloe Rot", "Aloe Rust", "Anthracnose", "Healthy", "Leaf Spot", "Sunburn"],
    "image_size": 384,
    "device": "cuda",
    "calibration": {
      "temperature": 1.2345,
      "is_calibrated": true,
      "thresholds": {
        "HIGH": 0.80,
        "MEDIUM": 0.60
      }
    },
    "training": {
      "epochs": 30,
      "val_loss": 0.1234,
      "val_acc": 0.95
    },
    "export": {
      "exported_at": "2026-01-06T10:00:00",
      "git_commit": "abc1234",
      "model_size_mb": 45.67
    }
  }
}
```

## Implementation Details

### Inference Pipeline

1. **Image Preprocessing:**
   - Resize to 416x416
   - Center crop to 384x384
   - Convert to tensor
   - Normalize with ImageNet stats

2. **Batch Processing:**
   - All images stacked into single batch
   - Single forward pass through model

3. **Temperature Scaling:**
   - Logits divided by temperature parameter
   - Improves probability calibration

4. **Aggregation:**
   - Probabilities averaged across all images
   - More robust than single image

5. **Top-3 Selection:**
   - Returns top 3 predictions sorted by confidence

### Confidence Thresholds

Thresholds are loaded from `model_metadata.json`:

- **HIGH**: confidence ≥ 0.80 → Show treatment
- **MEDIUM**: 0.60 ≤ confidence < 0.80 → Show treatment
- **LOW**: confidence < 0.60 → Suggest retake

These thresholds were determined during calibration to ensure reliability.

### Class Name Mapping

Critical: Class index order must match training:

```
0: Aloe Rot
1: Aloe Rust
2: Anthracnose
3: Healthy
4: Leaf Spot
5: Sunburn
```

Model outputs are mapped to disease IDs:
- "Aloe Rot" → `aloe_rot`
- "Aloe Rust" → `aloe_rust`
- etc.

## Troubleshooting

### Model Not Loading

**Error:** `FileNotFoundError: Model files not found`

**Solution:**
```bash
# Verify files exist
ls apps/server/data/models/
# Should contain: model.pt, model_metadata.json

# If missing, copy from training
cp apps/training/artifacts/model.pt apps/server/data/models/
cp apps/training/artifacts/model_metadata.json apps/server/data/models/
```

### PyTorch Import Error

**Error:** `ModuleNotFoundError: No module named 'torch'`

**Solution:**
```bash
pip install torch torchvision
```

### GPU Not Available

**Warning:** `Using device: cpu`

**Info:** This is normal if CUDA is not installed. CPU inference works but is slower.

**To enable GPU:**
1. Install CUDA toolkit
2. Install PyTorch with CUDA support:
   ```bash
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
   ```

### Class Name Mismatch

**Error:** Predictions don't match expected diseases

**Solution:** Ensure class ordering in `model_metadata.json` matches training exactly. Re-export model if needed.

### Low Confidence on All Predictions

**Issue:** All predictions return LOW confidence

**Possible causes:**
- Model needs more training
- Calibration temperature too high
- Input images very different from training data
- Preprocessing mismatch

**Debug:**
```bash
# Check model info
curl http://localhost:8000/api/v1/model_info

# Verify temperature is reasonable (typically 1.0-2.0)
# If > 3.0, re-run calibration
```

## Performance Optimization

### GPU Acceleration

For production, use GPU for faster inference:

1. Install CUDA-enabled PyTorch
2. Model automatically uses GPU if available
3. ~10-50x speedup vs CPU

### Batch Processing

Current implementation processes all images in a single batch for efficiency.

### Model Optimization (Future)

- TorchScript compilation for faster inference
- ONNX export for deployment flexibility
- FP16 quantization for 2x speedup on compatible GPUs

## Monitoring

Log files contain inference metrics:

```
INFO - Prediction complete. Top result: Healthy (0.923)
INFO - Received prediction request with 3 image(s)
```

Track these in production for model performance monitoring.

## Updating the Model

To deploy a new model version:

1. Train and export new model
2. Stop server
3. Backup old model:
   ```bash
   mv data/models/model.pt data/models/model.pt.backup
   ```
4. Copy new model
5. Start server
6. Test thoroughly before removing backup

## Security Considerations

- **Model files**: Ensure proper file permissions
- **File size limits**: Already enforced in `/predict` endpoint (10MB)
- **Input validation**: Images validated before inference
- **Rate limiting**: Consider adding for production

## Support

If issues persist:
1. Check server logs for detailed error messages
2. Verify all prerequisites are met
3. Test with placeholder service first
4. Review training pipeline output

---

**Last Updated:** January 6, 2026
