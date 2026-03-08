# End-to-End Testing Checklist

Complete testing guide for AloeVeraMate from model training to mobile app deployment.

## Prerequisites
- [ ] Dataset available at `dataset/Aloe Vera Leaf Disease Detection Dataset/`
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Mobile device with Expo Go app OR Android/iOS emulator

---

## Phase 1: Model Training & Evaluation

### Setup Training Environment
```bash
cd apps/training
pip install -r requirements.txt
```

### Dataset Preparation
- [ ] Dataset contains 2,800 images across 6 classes
- [ ] `manifest.csv` exists with all image paths
- [ ] No corrupted images (check `dataset/README.md`)

### Training Pipeline
```bash
# Create splits
python split.py
# Expected: train.csv, val.csv, test.csv created

# Train model (~30 minutes on GPU, ~2-3 hours on CPU)
python train.py --epochs 30 --batch_size 32
# Expected: model.pt saved, training metrics logged

# Calibrate probabilities
python calibrate.py
# Expected: calibration.json with temperature parameter

# Evaluate
python eval.py --calibration_path ./artifacts/calibration.json
# Expected: Confusion matrix, per-class metrics, ECE < 0.10

# Export for serving
python export.py
# Expected: model_metadata.json with complete config
```

### Validation Checks
- [ ] Training accuracy > 85%
- [ ] Validation accuracy > 85%
- [ ] Test accuracy > 80%
- [ ] ECE (Expected Calibration Error) < 0.10
- [ ] All artifacts created in `apps/training/artifacts/`:
  - model.pt (~90MB)
  - model_metadata.json
  - calibration.json
  - class_names.json
  - confusion_matrix.png
  - evaluation_results.json

---

## Phase 2: Backend Setup & Testing

### Copy Model Artifacts
```bash
# From repository root
# Windows
Copy-Item apps\training\artifacts\model.pt apps\server\data\models\
Copy-Item apps\training\artifacts\model_metadata.json apps\server\data\models\

# Linux/Mac
cp apps/training/artifacts/model.pt apps/server/data/models/
cp apps/training/artifacts/model_metadata.json apps/server/data/models/
```

- [ ] `apps/server/data/models/model.pt` exists
- [ ] `apps/server/data/models/model_metadata.json` exists

### Install Dependencies
```bash
cd apps/server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Start Server
```bash
uvicorn app.main:app --reload --port 8000
```

**Expected startup logs:**
```
INFO - Attempting to initialize PyTorch inference service...
INFO - Loading model metadata from .../data/models/model_metadata.json
INFO - Using device: cuda  # or cpu
INFO - Loading model from .../data/models/model.pt
INFO - Model loaded successfully: efficientnetv2-s
INFO - PyTorch inference service initialized successfully
INFO - ✓ Using PyTorch inference service
```

- [ ] Server starts without errors
- [ ] PyTorch inference service initializes (not placeholder)
- [ ] GPU detected (if available)

### Manual API Tests

**Health Check:**
```bash
curl http://localhost:8000/health
```
- [ ] Returns `{"status": "healthy", "version": "...", "message": "..."}`

**Model Info:**
```bash
curl http://localhost:8000/api/v1/model_info
```
- [ ] Returns model metadata
- [ ] Contains calibration temperature
- [ ] Contains thresholds (HIGH: 0.80, MEDIUM: 0.60)

**Prediction (with test image):**
```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "image1=@path/to/test.jpg"
```
- [ ] Returns predictions array
- [ ] confidence_status is HIGH/MEDIUM/LOW
- [ ] recommended_next_step provided

### Automated Testing
```bash
# Run unit tests
python -m pytest tests/ -v
# Expected: 18/18 tests passing

# Run integration test
python scripts/test_predict.py
# Expected output:
# ✓ /health endpoint: 200 OK
# ✓ /model_info endpoint: Returns model metadata
# ✓ /predict endpoint: Returns predictions with JSON response
```

- [ ] All unit tests pass (18/18)
- [ ] Integration test passes (3/3)
- [ ] Sample prediction returns valid JSON
- [ ] Top prediction is reasonable for test images

### Image Quality Tests

Test with intentionally poor images:

**Blurry Image:**
```bash
# Create blurry test image or use out-of-focus photo
python scripts/test_predict.py path/to/blurry.jpg
```
- [ ] Returns `confidence_status="LOW"`
- [ ] `retake_message` mentions "blur", "focus", or "steady"

**Dark Image:**
- [ ] Returns LOW confidence
- [ ] `retake_message` mentions "lighting" or "dark"

**Bright Image:**
- [ ] Returns LOW confidence
- [ ] `retake_message` mentions "overexposed" or "bright"

---

## Phase 3: Mobile App Setup & Testing

### Install Dependencies
```bash
cd apps/mobile
npm install
```

### Configure Environment
Create `.env` file:
```env
# For Android Emulator
API_URL=http://10.0.2.2:8000

# For iOS Simulator
API_URL=http://localhost:8000

# For Physical Device (replace with computer's local IP)
API_URL=http://192.168.1.XXX:8000
```

- [ ] `.env` file created with correct API_URL
- [ ] Backend is accessible from mobile device/emulator

### Start Expo
```bash
npm start
```

- [ ] Expo DevTools opens in browser
- [ ] QR code displayed OR emulator launches
- [ ] App loads without errors

### Manual UI Testing

**Home Screen:**
- [ ] "Analyze Plant" button visible
- [ ] App name and description displayed
- [ ] Smooth navigation

**Camera Capture:**
- [ ] Camera permission requested
- [ ] Can capture 3 photos
- [ ] Progress shows 1/3, 2/3, 3/3
- [ ] Can retake any photo
- [ ] Photos preview correctly

**Upload & Processing:**
- [ ] Progress bar animates during upload
- [ ] Loading spinner shows during inference
- [ ] No crashes on network errors

**Results - HIGH Confidence (≥80%):**
- [ ] Green "High Confidence" badge
- [ ] Top 3 predictions displayed
- [ ] Confidence percentages shown
- [ ] "Scientific Treatment" button visible
- [ ] "Ayurvedic Treatment" button visible

**Results - MEDIUM Confidence (60-79%):**
- [ ] Orange "Medium Confidence" badge
- [ ] Treatment buttons still available
- [ ] Warning message displayed

**Results - LOW Confidence (<60%):**
- [ ] Red "Low Confidence" badge
- [ ] Retake message displayed with specific tips
- [ ] "Retake Photos" button visible
- [ ] No treatment buttons shown

**Quality Check Failures:**
- [ ] Blurry image → Retake message with focus tips
- [ ] Dark image → Retake message with lighting tips
- [ ] Bright image → Retake message with exposure tips

**Treatment View:**
- [ ] Scientific treatment loads with steps
- [ ] Ayurvedic treatment loads with herbs
- [ ] Different content for each mode
- [ ] Citations displayed with sources
- [ ] Safety warnings visible

**Error Handling:**
- [ ] Network error shows friendly message
- [ ] Retry button works
- [ ] Can dismiss error and retry
- [ ] Timeout handled gracefully

---

## Phase 4: Integration Testing

### Multi-Image Aggregation
1. Capture 3 different photos of same plant
2. Submit for prediction
- [ ] Confidence is higher than single image
- [ ] Probabilities are averaged correctly

### Different Disease Classes
Test with images from each disease class:
- [ ] Aloe Rot correctly identified
- [ ] Aloe Rust correctly identified
- [ ] Anthracnose correctly identified
- [ ] Healthy correctly identified
- [ ] Leaf Spot correctly identified
- [ ] Sunburn correctly identified

### Edge Cases
- [ ] Single image submission works
- [ ] Three images submission works
- [ ] Large images (10MB) upload successfully
- [ ] Invalid file types rejected
- [ ] Server restart doesn't break app

---

## Phase 5: Performance Testing

### Backend Performance
- [ ] Model inference < 500ms on GPU
- [ ] Model inference < 2s on CPU
- [ ] Image quality checks < 50ms per image
- [ ] API response time < 3s total

### Mobile Performance
- [ ] App startup < 2s
- [ ] Camera opens < 1s
- [ ] Image capture is smooth (no lag)
- [ ] Navigation is responsive

---

## Phase 6: Documentation Review

- [ ] README.md has complete workflow
- [ ] Training pipeline documented in apps/training/README.md
- [ ] Model deployment guide exists (MODEL_DEPLOYMENT.md)
- [ ] Image quality docs exists (IMAGE_QUALITY.md)
- [ ] API endpoints documented
- [ ] Testing checklist complete (this file)

---

## Common Issues & Solutions

### Server won't start
- Check Python version (>= 3.10)
- Verify all dependencies installed
- Check port 8000 not in use
- Ensure model files copied correctly

### Model not loading
- Verify model.pt exists in apps/server/data/models/
- Check model_metadata.json exists
- Review server startup logs for errors
- Ensure PyTorch dependencies installed

### Mobile can't connect
- Check API_URL in .env is correct
- Verify server is running
- Test with curl from same network
- Check firewall settings

### Low accuracy
- Retrain with more epochs
- Check dataset quality
- Verify class distribution is balanced
- Review confusion matrix for patterns

### Poor calibration (high ECE)
- Re-run calibrate.py
- Increase validation set size
- Check temperature parameter is reasonable (1-2)

---

## Sign-Off Checklist

Before considering the project complete:

- [ ] All Phase 1-6 tests pass
- [ ] Documentation is complete and accurate
- [ ] Code is clean and commented
- [ ] No critical TODOs remaining
- [ ] Performance meets requirements
- [ ] Error handling is robust
- [ ] User experience is smooth

---

**Testing Date:** _____________  
**Tested By:** _____________  
**Status:** ⬜ Pass | ⬜ Fail | ⬜ Needs Review  
**Notes:**

---

Last Updated: January 6, 2026
