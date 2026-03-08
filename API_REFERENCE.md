# AloeVeraMate API Endpoints Reference

Quick reference for all available API endpoints.

## Base URL
```
http://localhost:8000
```

## Health & Metadata

### Health Check
```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-07T02:00:00.000000"
}
```

### Model Information
```http
GET /api/v1/model_info
```

**Response**:
```json
{
  "status": "success",
  "model": {
    "type": "pytorch",
    "architecture": "efficientnet_v2_s",
    "num_classes": 6,
    "class_names": ["Aloe Rot", "Aloe Rust", "Anthracnose", "Healthy", "Leaf Spot", "Sunburn"],
    "calibration": {
      "temperature": 1.3419,
      "ece_before": 0.1352,
      "ece_after": 0.0813,
      "thresholds": {
        "high_confidence": 0.8,
        "medium_confidence": 0.6
      }
    },
    "training_metrics": {
      "val_accuracy": 0.8179,
      "test_accuracy": 0.7786
    }
  }
}
```

---

## Disease Detection

### Predict Disease
```http
POST /api/v1/predict
Content-Type: multipart/form-data
```

**Request Body** (form-data):
- `image1`: File (required) - Close-up of lesion/affected area
- `image2`: File (optional) - Whole plant view
- `image3`: File (optional) - Base/soil view

**Image Requirements**:
- Format: jpg, jpeg, png
- Max size: 10 MB per image
- Min resolution: 224×224 pixels
- Quality: Blur score ≥100, brightness 40-220

**Response** (200 OK):
```json
{
  "request_id": "abc-123-def-456",
  "predictions": [
    {
      "disease_id": "aloe_rust",
      "disease_name": "Aloe Rust",
      "prob": 0.9943,
      "severity": "Moderate",
      "description": "Fungal disease causing rust-colored spots"
    },
    {
      "disease_id": "healthy",
      "disease_name": "Healthy",
      "prob": 0.0032,
      "severity": null,
      "description": "No disease detected"
    },
    {
      "disease_id": "aloe_rot",
      "disease_name": "Aloe Rot",
      "prob": 0.0015,
      "severity": "Severe",
      "description": "Bacterial or fungal rot"
    }
  ],
  "confidence_status": "HIGH",
  "recommended_next_step": "View detailed treatment plan",
  "retake_message": null
}
```

**Response** (LOW confidence with quality issues):
```json
{
  "request_id": "xyz-789",
  "predictions": [...],
  "confidence_status": "LOW",
  "recommended_next_step": "Retake photos for better results",
  "retake_message": "Please retake photos with better focus and lighting. Current issues: Image is blurry (focus score: 45.2 < 100). Try: Hold camera steady, ensure good lighting, tap to focus."
}
```

**Error Responses**:
- `400 Bad Request`: Invalid file format, size, or missing images
- `413 Payload Too Large`: Image exceeds 10 MB
- `422 Unprocessable Entity`: Image quality too poor
- `500 Internal Server Error`: Server error during prediction

---

## Disease Information

### Get All Diseases
```http
GET /api/v1/diseases
```

**Response**:
```json
{
  "diseases": [
    {
      "disease_id": "aloe_rot",
      "disease_name": "Aloe Rot",
      "description": "Bacterial or fungal rot affecting roots and base",
      "severity": "Severe",
      "common_symptoms": [
        "Soft, mushy tissue at base",
        "Foul odor",
        "Brown/black discoloration",
        "Wilting despite moist soil"
      ]
    },
    {
      "disease_id": "aloe_rust",
      "disease_name": "Aloe Rust",
      "description": "Fungal disease causing rust-colored spots",
      "severity": "Moderate",
      "common_symptoms": [
        "Orange-brown pustules on leaves",
        "Leaf yellowing around spots",
        "Premature leaf drop",
        "Spreads in humid conditions"
      ]
    },
    ...
  ],
  "count": 6
}
```

---

## Treatment Information

### Get Treatment Plan
```http
POST /api/v1/treatment
Content-Type: application/json
```

**Request Body**:
```json
{
  "disease_id": "aloe_rust",
  "mode": "SCIENTIFIC"  // or "AYURVEDIC"
}
```

**Response** (SCIENTIFIC):
```json
{
  "disease_id": "aloe_rust",
  "disease_name": "Aloe Rust",
  "mode": "SCIENTIFIC",
  "treatment_summary": "Apply copper-based fungicide every 7-10 days",
  "steps": [
    {
      "step_number": 1,
      "action": "Remove affected leaves",
      "details": "Cut infected leaves 2cm below lesions using sterilized scissors",
      "duration": "One-time",
      "frequency": "Once"
    },
    {
      "step_number": 2,
      "action": "Apply fungicide",
      "details": "Spray copper hydroxide (Kocide 3000) at 0.5-1.0 lb/100 gal water",
      "duration": "2-3 weeks",
      "frequency": "Every 7-10 days"
    },
    ...
  ],
  "safety_warnings": [
    "Wear gloves when handling fungicides",
    "Avoid spray drift to edible plants",
    "Do not use on plants intended for consumption within 14 days"
  ],
  "when_to_consult_expert": [
    "If rust spreads despite treatment after 3 weeks",
    "If more than 50% of plant is affected",
    "If black stem lesions appear (anthracnose)"
  ],
  "citations": [
    {
      "text": "Copper-based fungicides effective against aloe rust",
      "source": "Journal of Plant Pathology, 2019"
    }
  ]
}
```

**Response** (AYURVEDIC):
```json
{
  "disease_id": "aloe_rust",
  "disease_name": "Aloe Rust",
  "mode": "AYURVEDIC",
  "treatment_summary": "Use neem oil and turmeric paste for natural fungal control",
  "steps": [
    {
      "step_number": 1,
      "action": "Prepare neem oil spray",
      "details": "Mix 2 tablespoons neem oil + 1 tsp mild soap in 1 liter water",
      "duration": "2-3 weeks",
      "frequency": "Every 3-4 days"
    },
    {
      "step_number": 2,
      "action": "Apply turmeric paste",
      "details": "Mix turmeric powder with water, apply to lesions",
      "duration": "1 week",
      "frequency": "Daily"
    },
    ...
  ],
  "safety_warnings": [
    "Test neem oil on small area first (may cause leaf burn in hot sun)",
    "Apply in early morning or evening"
  ],
  "when_to_consult_expert": [...],
  "citations": [
    {
      "text": "Neem oil has antifungal properties effective against rust",
      "source": "Traditional Ayurvedic Plant Medicine, 2018"
    }
  ]
}
```

**Error Response**:
- `404 Not Found`: Disease ID not found or treatment mode invalid

---

## User Feedback (NEW ✨)

### Submit Feedback
```http
POST /api/v1/feedback
Content-Type: application/json
```

**Request Body**:
```json
{
  "request_id": "abc-123-def-456",      // From prediction response
  "selected_disease_id": "aloe_rot",    // User's correction or original disease_id
  "was_prediction_helpful": false,      // true if correct, false if wrong
  "notes": "It was actually root rot"   // Optional, max 500 chars
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Thank you for your feedback! This helps us improve our model.",
  "feedback_id": 42
}
```

**Error Response**:
- `404 Not Found`: request_id not found
- `400 Bad Request`: Invalid disease_id or missing required fields
- `500 Internal Server Error`: Failed to save feedback

---

### Get Feedback Statistics
```http
GET /api/v1/feedback/stats
```

**Response**:
```json
{
  "total_predictions": 150,
  "total_feedback": 45,
  "feedback_rate": "30.0%",
  "helpful_rate": "82.2%",
  "confidence_distribution": {
    "HIGH": 120,
    "MEDIUM": 20,
    "LOW": 10
  },
  "common_corrections": [
    {
      "predicted_disease_id": "aloe_rust",
      "selected_disease_id": "aloe_rot",
      "count": 5
    },
    {
      "predicted_disease_id": "healthy",
      "selected_disease_id": "aloe_rust",
      "count": 3
    }
  ]
}
```

**Use Cases**:
- Monitor model accuracy over time
- Identify common misclassifications
- Decide when to retrain model
- Evaluate confidence calibration effectiveness

---

## Testing Examples

### cURL Examples

```bash
# Health check
curl http://localhost:8000/health

# Model info
curl http://localhost:8000/api/v1/model_info

# Predict with single image
curl -X POST http://localhost:8000/api/v1/predict \
  -F "image1=@/path/to/aloe_leaf.jpg"

# Predict with multiple images
curl -X POST http://localhost:8000/api/v1/predict \
  -F "image1=@closeup.jpg" \
  -F "image2=@whole_plant.jpg" \
  -F "image3=@base.jpg"

# Get all diseases
curl http://localhost:8000/api/v1/diseases

# Get scientific treatment
curl -X POST http://localhost:8000/api/v1/treatment \
  -H "Content-Type: application/json" \
  -d '{"disease_id": "aloe_rust", "mode": "SCIENTIFIC"}'

# Submit feedback
curl -X POST http://localhost:8000/api/v1/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "abc-123",
    "selected_disease_id": "aloe_rot",
    "was_prediction_helpful": false,
    "notes": "Actually root rot"
  }'

# Get feedback stats
curl http://localhost:8000/api/v1/feedback/stats
```

### Python Examples

```python
import requests

BASE_URL = "http://localhost:8000"

# Predict disease
with open('aloe_image.jpg', 'rb') as f:
    files = {'image1': ('aloe.jpg', f, 'image/jpeg')}
    response = requests.post(f"{BASE_URL}/api/v1/predict", files=files)
    result = response.json()
    print(f"Top prediction: {result['predictions'][0]['disease_name']}")
    request_id = result['request_id']  # Save for feedback

# Submit feedback
feedback = {
    "request_id": request_id,
    "selected_disease_id": "aloe_rust",
    "was_prediction_helpful": True,
    "notes": "Perfect diagnosis!"
}
response = requests.post(f"{BASE_URL}/api/v1/feedback", json=feedback)
print(response.json()['message'])
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: File too large
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production:
- Max 100 predictions per IP per hour
- Max 1000 feedback submissions per IP per day

---

## CORS

CORS is enabled for development:
- Allowed origins: `*` (all)
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: `*`

For production, restrict to mobile app domains only.

---

**Last Updated**: January 7, 2026  
**API Version**: 1.0  
**Server**: FastAPI 0.115.6
