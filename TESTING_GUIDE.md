# Testing Guide

## 🧪 Testing the Backend API

### Prerequisites
- Backend server running on port 8000
- curl or Postman installed
- Sample image files (any JPG/PNG images will work)

### 1. Health Check

**Test that server is running:**
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "message": "AloeVeraMate API is running"
}
```

### 2. Get Diseases List

**Test diseases endpoint:**
```bash
curl http://localhost:8000/api/v1/diseases
```

**Expected Response:**
```json
{
  "diseases": [
    {
      "disease_id": "root_rot",
      "disease_name": "Root Rot",
      "description": "Fungal infection caused by overwatering...",
      "severity": "HIGH",
      "common_symptoms": ["Soft mushy roots", "Yellowing leaves", ...]
    },
    ...
  ],
  "count": 8
}
```

**Verify:**
- Returns 8 diseases
- Each has disease_id, disease_name, description, severity, common_symptoms

### 3. Test Prediction (Single Image)

**Create a test image (any image will work):**
```bash
# Save any image as test.jpg
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "image1=@test.jpg"
```

**Expected Response:**
```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "predictions": [
    {
      "disease_id": "root_rot",
      "disease_name": "Root Rot",
      "prob": 0.456
    },
    {
      "disease_id": "leaf_spot",
      "disease_name": "Aloe Leaf Spot",
      "prob": 0.312
    },
    {
      "disease_id": "healthy",
      "disease_name": "Healthy Plant",
      "prob": 0.232
    }
  ],
  "confidence_status": "LOW",
  "recommended_next_step": "RETAKE",
  "symptoms_summary": "Common symptoms: Soft mushy roots, Yellowing leaves, Foul odor from soil"
}
```

**Verify:**
- Returns 3 predictions
- Probabilities sum to ~1.0
- confidence_status is HIGH/MEDIUM/LOW
- recommended_next_step is RETAKE or SHOW_TREATMENT

### 4. Test Prediction (Multiple Images)

```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "image1=@photo1.jpg" \
  -F "image2=@photo2.jpg" \
  -F "image3=@photo3.jpg"
```

**Verify:**
- Accepts 1-3 images
- Same images produce same predictions (deterministic)

### 5. Test Determinism

**Upload same image twice:**
```bash
# First upload
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "image1=@test.jpg" > result1.json

# Second upload (same image)
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "image1=@test.jpg" > result2.json

# Compare results (should be identical)
diff result1.json result2.json
```

**Verify:**
- No differences between result1.json and result2.json
- Predictions are identical
- Probabilities are identical

### 6. Test Treatment (Scientific)

```bash
curl -X POST "http://localhost:8000/api/v1/treatment" \
  -H "Content-Type: application/json" \
  -d '{
    "disease_id": "root_rot",
    "mode": "SCIENTIFIC"
  }'
```

**Expected Response:**
```json
{
  "disease_id": "root_rot",
  "mode": "SCIENTIFIC",
  "steps": [
    {
      "title": "Remove from pot and inspect roots",
      "details": "Carefully remove the plant...",
      "duration": "Immediate",
      "frequency": "Once"
    },
    ...
  ],
  "dosage_frequency": "Fungicide application: Follow product label...",
  "safety_warnings": [
    "Wear gloves when handling fungicides...",
    ...
  ],
  "when_to_consult_expert": [
    "More than 70% of roots are affected",
    ...
  ],
  "citations": [
    {
      "title": "Management of Pythium Root Rot in Ornamental Plants",
      "source": "University of Florida IFAS Extension, 2021",
      "snippet": "Removing infected roots and improving drainage..."
    },
    ...
  ]
}
```

**Verify:**
- Returns multiple steps
- Has dosage_frequency
- Has safety_warnings array
- Has when_to_consult_expert array
- Has citations with title, source, snippet

### 7. Test Treatment (Ayurvedic)

```bash
curl -X POST "http://localhost:8000/api/v1/treatment" \
  -H "Content-Type: application/json" \
  -d '{
    "disease_id": "root_rot",
    "mode": "AYURVEDIC"
  }'
```

**Verify:**
- Different steps than scientific treatment
- Includes herbal remedies (neem, turmeric, etc.)
- Has citations for Ayurvedic sources

### 8. Test Error Handling

**Test invalid disease_id:**
```bash
curl -X POST "http://localhost:8000/api/v1/treatment" \
  -H "Content-Type: application/json" \
  -d '{
    "disease_id": "invalid_disease",
    "mode": "SCIENTIFIC"
  }'
```

**Expected:** 404 error with message

**Test missing image:**
```bash
curl -X POST "http://localhost:8000/api/v1/predict"
```

**Expected:** 400 error with message "At least one image is required"

**Test invalid file type:**
```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "image1=@document.pdf"
```

**Expected:** 400 error about invalid file type

### 9. Test CORS (from mobile app)

**From mobile app, check network tab:**
- Requests should succeed
- No CORS errors in console
- Access-Control-Allow-Origin: * header present

## 📱 Testing the Mobile App

### Prerequisites
- Backend running on port 8000
- Mobile app running in Expo
- Proper API_URL configured in .env

### 1. Test Home Screen

**Steps:**
1. Launch app
2. See "Welcome to AloeVeraMate" message
3. Tap "Start Disease Detection" button
4. Should navigate to capture guide

### 2. Test Capture Guide

**Steps:**
1. See photography instructions
2. See sample overlay image
3. See tips (lighting, focus, angles)
4. Tap "Start Capture" button
5. Should navigate to camera screen

### 3. Test Camera Permissions

**Steps:**
1. First time: Request camera permissions
2. Grant permissions
3. Camera view should appear
4. If denied: Error message appears

### 4. Test Multi-Photo Capture

**Steps:**
1. See "Stage 1/3: Close-up of lesion" instruction
2. Tap capture button
3. See photo preview
4. Options: "Retake" or "Next Photo"
5. Tap "Next Photo"
6. See "Stage 2/3: Whole plant view"
7. Repeat for stage 3
8. After stage 3, automatically navigate to upload

**Verify:**
- Progress indicator updates (1/3, 2/3, 3/3)
- Can retake any photo
- Photos are saved correctly

### 5. Test Upload

**Steps:**
1. See "Preparing images..." message
2. See progress bar
3. Progress updates: Preparing → Uploading → Analyzing
4. After completion, navigate to results

**Verify:**
- Progress bar animates smoothly
- Error handling if network fails
- Retry button appears on error

### 6. Test Results (Low Confidence)

**Upload images that result in low confidence (<60%):**

**Verify:**
1. See "Low Confidence Detection" warning
2. See retake tips (lighting, angle, focus, distance, clean lens)
3. See top 2 predictions with percentages
4. "Retake Photos" button visible
5. No treatment buttons shown

### 7. Test Results (Medium Confidence)

**Upload images that result in medium confidence (60-79%):**

**Verify:**
1. See "Medium Confidence" badge (orange)
2. See top 3 predictions
3. See confidence bars for each prediction
4. See warning about moderate confidence
5. "Scientific Treatment" and "Ayurvedic Treatment" buttons visible
6. "Retake Photos" button at bottom

### 8. Test Results (High Confidence)

**Upload images that result in high confidence (≥80%):**

**Verify:**
1. See "High Confidence" badge (green)
2. See top 3 predictions
3. See confidence bars
4. No warning message
5. "Scientific Treatment" and "Ayurvedic Treatment" buttons visible
6. "Retake Photos" button at bottom

### 9. Test Treatment (Scientific)

**Steps:**
1. From results, tap "Scientific Treatment"
2. Wait for treatment to load

**Verify:**
1. See 🔬 icon and disease name
2. See "Scientific Treatment" badge
3. See multiple treatment steps with numbers
4. Each step has title, details, duration, frequency
5. See "Dosage & Frequency" section
6. See "Safety Warnings" section (orange card)
7. See "When to Consult an Expert" section (green card)
8. See "Sources & Citations" section with references
9. "Back to Home" button at bottom

### 10. Test Treatment (Ayurvedic)

**Steps:**
1. From results, tap "Ayurvedic Treatment"

**Verify:**
1. See 🌿 icon and disease name
2. See "Ayurvedic Treatment" badge
3. Different steps than scientific (herbal remedies)
4. Mentions neem, turmeric, Ayurvedic concepts
5. Has citations for Ayurvedic sources

### 11. Test Navigation Flow

**Complete flow:**
1. Home → Capture Guide → Camera
2. Camera (3 stages) → Upload
3. Upload → Results
4. Results → Treatment
5. Treatment → "Back to Home" → Home
6. From Results → "Retake Photos" → Camera (restarts capture)

**Verify all navigation works correctly**

### 12. Test Error Scenarios

**Scenario 1: Backend down**
1. Stop backend server
2. Try to upload images
3. Should see error message
4. Retry button should appear

**Scenario 2: Network timeout**
1. Disconnect from network
2. Try to upload
3. Should see network error message

**Scenario 3: Invalid API response**
1. Temporarily modify backend to return invalid JSON
2. Try to upload
3. Should handle gracefully with error message

## 🔍 Verification Checklist

### Backend Tests
- [ ] Health check returns 200 OK
- [ ] /diseases returns 8 diseases
- [ ] /predict accepts 1-3 images
- [ ] Same images produce same predictions
- [ ] Probabilities sum to ~1.0
- [ ] Confidence status is correct (HIGH/MEDIUM/LOW)
- [ ] /treatment returns scientific treatment
- [ ] /treatment returns ayurvedic treatment
- [ ] Error handling works (404, 400, 422)
- [ ] CORS headers present

### Mobile App Tests
- [ ] App launches successfully
- [ ] Home screen displays correctly
- [ ] Camera permissions work
- [ ] Can capture 3 photos
- [ ] Can retake photos
- [ ] Upload shows progress
- [ ] Results display based on confidence
- [ ] Low confidence shows retake tips
- [ ] Medium/High confidence shows treatment buttons
- [ ] Scientific treatment loads and displays
- [ ] Ayurvedic treatment loads and displays
- [ ] Navigation works in both directions
- [ ] Error handling works
- [ ] "Back to Home" button works

### Integration Tests
- [ ] Mobile can connect to backend
- [ ] Images upload successfully
- [ ] Results display correctly
- [ ] Treatment fetches correctly
- [ ] Same images produce same UI state
- [ ] Network errors handled gracefully
- [ ] API errors handled gracefully

## 🐛 Common Issues & Solutions

### Backend Issues

**Issue: ModuleNotFoundError**
```bash
Solution: Activate venv and install dependencies
source venv/bin/activate
pip install -r requirements.txt
```

**Issue: Port 8000 already in use**
```bash
Solution: Use different port
uvicorn app.main:app --reload --port 8001
```

**Issue: FileNotFoundError for data files**
```bash
Solution: Ensure data directory exists
ls apps/server/data/diseases.json
ls apps/server/data/treatments/
```

### Mobile App Issues

**Issue: Cannot connect to backend**
```bash
Solution: Check API_URL in .env
Android: http://10.0.2.2:8000
iOS: http://localhost:8000
Physical device: http://YOUR_IP:8000
```

**Issue: Camera permissions not working**
```bash
Solution: 
1. Grant permissions in device settings
2. Restart Expo Go app
3. Clear app cache
```

**Issue: TypeScript errors**
```bash
Solution:
npm install
# Restart TypeScript server in VS Code
```

## 📊 Performance Testing

### Load Testing

```bash
# Install Apache Bench
# Test /health endpoint
ab -n 1000 -c 10 http://localhost:8000/health

# Test /diseases endpoint
ab -n 100 -c 5 http://localhost:8000/api/v1/diseases
```

### Response Time Expectations

- Health check: <10ms
- Get diseases: <50ms
- Predict (1 image): <200ms
- Predict (3 images): <500ms
- Get treatment: <100ms

## ✅ Test Results Template

```
Date: ___________
Tester: ___________

Backend Tests:
✓ Health check
✓ Get diseases
✓ Predict single image
✓ Predict multiple images
✓ Deterministic predictions
✓ Scientific treatment
✓ Ayurvedic treatment
✓ Error handling

Mobile Tests:
✓ Home screen
✓ Capture guide
✓ Camera capture (3 stages)
✓ Upload progress
✓ Results (low confidence)
✓ Results (medium confidence)
✓ Results (high confidence)
✓ Scientific treatment display
✓ Ayurvedic treatment display
✓ Navigation flow
✓ Error handling

Notes:
________________
________________
```
