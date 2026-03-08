# Enhancements to /predict Endpoint

## Summary

Enhanced the `/predict` endpoint with improved confidence calculation, input validation, logging, and better user guidance for retaking photos.

## Changes Made

### 1. **Confidence Calculation** ✅
- **Before**: Used arbitrary logic
- **After**: Confidence = `max(probabilities)` from top-3 predictions
- **Thresholds**:
  - `HIGH`: ≥ 0.80 (80%)
  - `MEDIUM`: 0.60 - 0.79 (60-79%)
  - `LOW`: < 0.60 (<60%)

### 2. **Low Confidence Handling** ✅
- **Action**: When confidence is `LOW`, set `recommended_next_step="RETAKE"`
- **Retake Message**: Automatically generated with specific tips:
  - Lighting advice (natural daylight)
  - Focus guidance
  - Camera stability tips
  - Lens cleaning reminder
  - Number of images recommendation (suggests taking all 3 if user submitted fewer)
  - Additional context-specific advice

### 3. **Predictions Sorting** ✅
- Always return **top-3 predictions**
- Sorted by `prob` in **descending order**
- Highest confidence prediction is always first

### 4. **Logging** ✅
Implemented comprehensive logging throughout the prediction pipeline:

**Request Level:**
```python
logger.info(f"Received prediction request with {len(images)} image(s)")
logger.info(f"Request {request_id}: Processing {len(image_paths)} images, hash={image_hash[:16]}...")
logger.info(f"Request {request_id}: Confidence={confidence_status} (max_prob={max_prob:.3f}), Action={recommended_next_step}")
logger.info(f"Request {result.request_id}: Returning {len(result.predictions)} predictions, confidence={result.confidence_status}")
```

**Validation Level:**
```python
logger.debug(f"Validated image {idx + 1}: {file.filename}, size={file_size / 1024:.1f}KB, type={file.content_type}")
```

### 5. **Input Validation** ✅

**Image Type Validation:**
- Checks `content_type` starts with `"image/"`
- Validates file extension is in allowed list: `jpg`, `jpeg`, `png`
- Provides detailed error messages: `"File 1 must be an image (received: application/pdf)"`

**File Size Validation:**
- Maximum size: **10MB** (configurable in `settings.MAX_UPLOAD_SIZE`)
- Checks after upload to get actual file size
- Cleans up file immediately if validation fails
- Error message includes sizes: `"File 1 exceeds maximum size of 10.0MB (received: 15.3MB)"`

**Empty File Check:**
- Rejects files with 0 bytes
- Prevents processing of corrupt/empty uploads

### 6. **Schema Updates** ✅
Added new field to `PredictResponse`:
```python
class PredictResponse(BaseModel):
    request_id: str
    predictions: List[DiseasePrediction]
    confidence_status: Literal["HIGH", "MEDIUM", "LOW"]
    recommended_next_step: Literal["RETAKE", "SHOW_TREATMENT"]
    symptoms_summary: str
    retake_message: Optional[str] = Field(None, description="Message with tips for retaking photos (only for LOW confidence)")
```

### 7. **Mobile App Updates** ✅
Updated `results.tsx` to:
- Accept new `retake_message` field
- Display retake message in LOW confidence UI
- Style retake message prominently in orange/warning color

## Files Modified

### Backend
1. **`app/schemas.py`**
   - Added `retake_message` field to `PredictResponse`

2. **`app/services/disease_prediction.py`**
   - Updated `_generate_predictions()` to sort predictions by prob desc
   - Rewrote `_determine_confidence_status()` to use max(prob) and return retake message
   - Added `_generate_retake_message()` method for context-specific guidance
   - Enhanced `predict_multiple()` with logging
   - Added `Optional` import for type hints

3. **`app/api/prediction.py`**
   - Added logging import and logger instance
   - Enhanced file validation with detailed error messages
   - Added file size validation (10MB limit)
   - Added empty file check
   - Added debug logging for each validated image
   - Added info logging before and after prediction

4. **`app/main.py`**
   - Configured logging with proper format and handlers
   - Set log level to INFO

### Mobile App
5. **`apps/mobile/app/results.tsx`**
   - Added `retake_message?: string` to `DiseaseResponse` interface
   - Display retake message in LOW confidence card
   - Added `retakeMessageText` style

## API Response Example

### HIGH Confidence (≥80%)
```json
{
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "predictions": [
    {"disease_id": "root_rot", "disease_name": "Root Rot", "prob": 0.856},
    {"disease_id": "leaf_spot", "disease_name": "Aloe Leaf Spot", "prob": 0.092},
    {"disease_id": "healthy", "disease_name": "Healthy Plant", "prob": 0.052}
  ],
  "confidence_status": "HIGH",
  "recommended_next_step": "SHOW_TREATMENT",
  "symptoms_summary": "Common symptoms: Soft mushy roots, Yellowing leaves, Foul odor from soil",
  "retake_message": null
}
```

### LOW Confidence (<60%)
```json
{
  "request_id": "123e4567-e89b-12d3-a456-426614174001",
  "predictions": [
    {"disease_id": "leaf_spot", "disease_name": "Aloe Leaf Spot", "prob": 0.456},
    {"disease_id": "root_rot", "disease_name": "Root Rot", "prob": 0.312},
    {"disease_id": "healthy", "disease_name": "Healthy Plant", "prob": 0.232}
  ],
  "confidence_status": "LOW",
  "recommended_next_step": "RETAKE",
  "symptoms_summary": "Common symptoms: Brown spots on leaves, Circular lesions, Leaf discoloration",
  "retake_message": "Confidence is low (45.6%). Please retake photos with these tips: Ensure good lighting - natural daylight is best; Focus clearly on the affected areas; Hold camera steady to avoid blur; Take all 3 photos for better accuracy: close-up of lesion, whole plant view, and base/soil view; Clean the camera lens before taking photos; Avoid shadows and reflections on the plant"
}
```

## Logging Output Example

```
2026-01-06 10:30:15 - app.api.prediction - INFO - Received prediction request with 3 image(s)
2026-01-06 10:30:15 - app.api.prediction - DEBUG - Validated image 1: plant_lesion.jpg, size=2456.3KB, type=image/jpeg
2026-01-06 10:30:15 - app.api.prediction - DEBUG - Validated image 2: whole_plant.jpg, size=3201.5KB, type=image/jpeg
2026-01-06 10:30:15 - app.api.prediction - DEBUG - Validated image 3: base_view.jpg, size=2890.1KB, type=image/jpeg
2026-01-06 10:30:15 - app.services.disease_prediction - INFO - Request 123e4567-e89b-12d3-a456-426614174000: Processing 3 images, hash=a1b2c3d4e5f6g7h8...
2026-01-06 10:30:15 - app.services.disease_prediction - INFO - Request 123e4567-e89b-12d3-a456-426614174000: Confidence=HIGH (max_prob=0.856), Action=SHOW_TREATMENT
2026-01-06 10:30:15 - app.api.prediction - INFO - Request 123e4567-e89b-12d3-a456-426614174000: Returning 3 predictions, confidence=HIGH
```

## Error Handling Examples

### Invalid File Type
```bash
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@document.pdf"
```
**Response:**
```json
{
  "detail": "File 1 must be an image (received: application/pdf)"
}
```

### File Too Large
```bash
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@huge_image.jpg"
```
**Response:**
```json
{
  "detail": "File 1 exceeds maximum size of 10.0MB (received: 15.3MB)"
}
```

### Invalid Extension
```bash
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@image.gif"
```
**Response:**
```json
{
  "detail": "File extension must be one of: jpg, jpeg, png (received: gif)"
}
```

### Empty File
```bash
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@empty.jpg"
```
**Response:**
```json
{
  "detail": "File 1 is empty"
}
```

## Configuration

All settings are configurable in `app/config.py`:

```python
class Settings(BaseSettings):
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set[str] = {"jpg", "jpeg", "png"}
```

## Testing

### Test High Confidence
```bash
# Upload 3 clear images
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "image1=@clear_lesion.jpg" \
  -F "image2=@whole_plant.jpg" \
  -F "image3=@base_view.jpg"

# Expected: confidence_status="HIGH", recommended_next_step="SHOW_TREATMENT", retake_message=null
```

### Test Low Confidence
```bash
# Upload 1 unclear image
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "image1=@blurry_photo.jpg"

# Expected: confidence_status="LOW", recommended_next_step="RETAKE", retake_message="..."
```

### Test Determinism
```bash
# Upload same images twice
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@test.jpg" > result1.json
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@test.jpg" > result2.json

# Compare (should be identical except request_id)
diff <(jq -S 'del(.request_id)' result1.json) <(jq -S 'del(.request_id)' result2.json)
```

### Test Input Validation
```bash
# Test file size limit (create 15MB file)
dd if=/dev/zero of=large.jpg bs=1M count=15
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@large.jpg"
# Expected: 400 error with size details

# Test invalid type
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@document.pdf"
# Expected: 400 error "must be an image"

# Test empty file
touch empty.jpg
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@empty.jpg"
# Expected: 400 error "File 1 is empty"
```

### Monitor Logs
```bash
# Start server and watch logs
uvicorn app.main:app --reload --port 8000

# In another terminal, send requests and observe structured logging
```

## Benefits

1. **Better User Experience**: Clear guidance when photos need retaking
2. **Improved Accuracy**: Confidence based on actual probability scores
3. **Debugging**: Comprehensive logging for troubleshooting
4. **Security**: File size limits prevent DOS attacks
5. **Validation**: Reject invalid files early with clear error messages
6. **Consistency**: Always return top-3 predictions in descending order
7. **Transparency**: Users understand why retake is needed

## Next Steps

To use the enhanced endpoint:

1. **Install dependencies** (if not done):
   ```bash
   cd apps/server
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```

2. **Start server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

3. **Test with mobile app** or cURL

4. **Monitor logs** to see request flow and confidence calculations

## Migration Notes

**Breaking Changes**: None - This is backward compatible. The `retake_message` field is optional.

**Mobile App**: Already updated to display retake messages. No action needed.

**Testing**: Use TESTING_GUIDE.md for comprehensive test scenarios.
