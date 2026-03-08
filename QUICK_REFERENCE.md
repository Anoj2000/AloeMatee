# Quick Reference: Enhanced /predict Endpoint

## What Changed

### ✅ Confidence Calculation
```python
# Before: Used top_prob directly
confidence = predictions[0].prob

# After: Use max(probabilities)
max_prob = max(pred.prob for pred in predictions)
```

### ✅ Thresholds
- **HIGH**: ≥ 80%
- **MEDIUM**: 60-79%
- **LOW**: < 60%

### ✅ Low Confidence Response
```json
{
  "confidence_status": "LOW",
  "recommended_next_step": "RETAKE",
  "retake_message": "Confidence is low (45.6%). Please retake photos with these tips: Ensure good lighting - natural daylight is best; Focus clearly on the affected areas; Hold camera steady to avoid blur; Take all 3 photos for better accuracy..."
}
```

### ✅ Input Validation
- **File types**: Only jpg, jpeg, png
- **File size**: Max 10MB
- **Empty files**: Rejected
- **Error messages**: Detailed and specific

### ✅ Logging
```
INFO - Received prediction request with 3 image(s)
DEBUG - Validated image 1: plant_lesion.jpg, size=2456.3KB, type=image/jpeg
INFO - Request abc123: Processing 3 images, hash=a1b2c3d4...
INFO - Request abc123: Confidence=HIGH (max_prob=0.856), Action=SHOW_TREATMENT
INFO - Request abc123: Returning 3 predictions, confidence=HIGH
```

## API Response Structure

### New Field: `retake_message`
```python
class PredictResponse(BaseModel):
    request_id: str
    predictions: List[DiseasePrediction]  # Always top-3, sorted by prob desc
    confidence_status: Literal["HIGH", "MEDIUM", "LOW"]
    recommended_next_step: Literal["RETAKE", "SHOW_TREATMENT"]
    symptoms_summary: str
    retake_message: Optional[str]  # NEW: Only for LOW confidence
```

## Quick Test Commands

```bash
# Test with 1 image
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@test.jpg"

# Test with 3 images
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "image1=@test1.jpg" \
  -F "image2=@test2.jpg" \
  -F "image3=@test3.jpg"

# Test file size validation (should fail)
dd if=/dev/zero of=large.jpg bs=1M count=15
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@large.jpg"

# Test invalid file type (should fail)
curl -X POST "http://localhost:8000/api/v1/predict" -F "image1=@document.pdf"
```

## Log Levels

- **INFO**: Request flow, confidence results
- **DEBUG**: File validation details
- **WARNING**: Unusual conditions
- **ERROR**: Processing failures

## Files Modified

**Backend:**
- `app/schemas.py` - Added retake_message field
- `app/services/disease_prediction.py` - Enhanced confidence logic + logging
- `app/api/prediction.py` - Added validation + logging
- `app/main.py` - Configured logging

**Mobile:**
- `apps/mobile/app/results.tsx` - Display retake messages

## Configuration (app/config.py)

```python
MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS: set[str] = {"jpg", "jpeg", "png"}
```

## Mobile App Changes

The LOW confidence screen now shows:
```tsx
{result.retake_message && (
  <Text style={styles.retakeMessageText}>
    {result.retake_message}
  </Text>
)}
```

## Ready to Run

1. Install dependencies: `pip install -r requirements.txt`
2. Start server: `uvicorn app.main:app --reload --port 8000`
3. Test with mobile app or cURL
4. Check logs in terminal

All enhancements are **backward compatible**! 🎉
