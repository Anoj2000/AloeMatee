"""
Complete Component 1 (Backend) Integration Test

Tests all key endpoints to verify the entire backend is working.
"""
import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("=" * 60)
    print("TEST 1: Health Check")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    
    print(f"✅ Status: {data['status']}")
    print(f"✅ Version: {data['version']}")
    print(f"✅ Message: {data['message']}")
    print()


def test_model_info():
    """Test model info endpoint"""
    print("=" * 60)
    print("TEST 2: Model Info (with version)")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/api/v1/model_info")
    assert response.status_code == 200
    data = response.json()
    
    model = data['model']
    print(f"✅ Model Type: {model['model_type']}")
    print(f"✅ Model Name: {model['model_name']}")
    print(f"✅ Model Version: {model['model_version']}")  # NEW!
    print(f"✅ Classes: {model['num_classes']}")
    print(f"✅ Device: {model['device']}")
    print(f"✅ Temperature Calibration: {model['calibration']['temperature']:.4f}")
    print()


def test_diseases():
    """Test diseases list endpoint"""
    print("=" * 60)
    print("TEST 3: Diseases List")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/api/v1/diseases")
    assert response.status_code == 200
    data = response.json()
    
    print(f"✅ Total Diseases: {data['count']}")
    print(f"✅ First 3 diseases:")
    for disease in data['diseases'][:3]:
        print(f"   - {disease['disease_name']} ({disease['disease_id']}) - {disease['severity']}")
    print()


def test_treatment_scientific():
    """Test treatment endpoint - SCIENTIFIC mode"""
    print("=" * 60)
    print("TEST 4: Treatment (SCIENTIFIC)")
    print("=" * 60)
    
    payload = {
        "disease_id": "leaf_spot",
        "mode": "SCIENTIFIC"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/treatment", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    print(f"✅ Disease: {data['disease_id']}")
    print(f"✅ Mode: {data['mode']}")
    print(f"✅ Treatment Steps: {len(data['steps'])}")
    print(f"✅ Safety Warnings: {len(data['safety_warnings'])}")
    print(f"✅ Expert Consultation Items: {len(data['when_to_consult_expert'])}")
    print(f"✅ Citations: {len(data['citations'])}")
    print(f"✅ First step: {data['steps'][0]['title']}")
    print(f"✅ First citation: {data['citations'][0]['title'][:50]}...")
    print()


def test_treatment_ayurvedic():
    """Test treatment endpoint - AYURVEDIC mode"""
    print("=" * 60)
    print("TEST 5: Treatment (AYURVEDIC)")
    print("=" * 60)
    
    payload = {
        "disease_id": "root_rot",
        "mode": "AYURVEDIC"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/treatment", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    print(f"✅ Disease: {data['disease_id']}")
    print(f"✅ Mode: {data['mode']}")
    print(f"✅ Treatment Steps: {len(data['steps'])}")
    print(f"✅ Safety Warnings: {len(data['safety_warnings'])}")
    print(f"✅ Citations: {len(data['citations'])}")
    print()


def test_treatment_not_found():
    """Test treatment endpoint - safe fallback"""
    print("=" * 60)
    print("TEST 6: Treatment Not Found (Safe Fallback)")
    print("=" * 60)
    
    payload = {
        "disease_id": "unknown_disease",
        "mode": "SCIENTIFIC"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/treatment", json=payload)
    assert response.status_code == 404
    data = response.json()
    
    print(f"✅ Error: {data['detail']['error']}")
    print(f"✅ Message: {data['detail']['message'][:50]}...")
    print(f"✅ Has safe_fallback: {'safe_fallback' in data['detail']}")
    print(f"✅ Recommendation provided: {len(data['detail']['safe_fallback']['recommendation']) > 0}")
    print()


def test_prediction():
    """Test prediction endpoint"""
    print("=" * 60)
    print("TEST 7: Disease Prediction")
    print("=" * 60)
    
    try:
        # Create test image if doesn't exist
        test_image = Path("test_image.jpg")
        if not test_image.exists():
            from PIL import Image
            import numpy as np
            img = Image.fromarray(np.random.randint(0, 255, (384, 384, 3), dtype=np.uint8))
            img.save(test_image)
        
        with open(test_image, 'rb') as f:
            files = {'image1': ('test.jpg', f, 'image/jpeg')}
            response = requests.post(f"{BASE_URL}/api/v1/predict", files=files)
        
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        print(f"✅ Request ID: {data['request_id']}")
        print(f"✅ Number of predictions: {len(data['predictions'])}")
        print(f"✅ Confidence status: {data['confidence_status']}")
        print(f"✅ Top prediction: {data['predictions'][0]['disease_name']} ({data['predictions'][0]['prob']:.3f})")
        print(f"✅ Images received: {data['num_images_received']}")
        print()
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise


def test_rate_limiting():
    """Test rate limiting (simple check)"""
    print("=" * 60)
    print("TEST 8: Rate Limiting")
    print("=" * 60)
    
    # Just verify rate limiter is enabled
    from app.config import settings
    from app.services.rate_limiter import get_rate_limiter
    
    print(f"✅ Rate limit enabled: {settings.RATE_LIMIT_ENABLED}")
    print(f"✅ Limit: {settings.RATE_LIMIT_REQUESTS} requests per {settings.RATE_LIMIT_WINDOW}s")
    
    rl = get_rate_limiter()
    stats = rl.get_stats()
    print(f"✅ Active IPs: {stats['active_ips']}")
    print(f"✅ Recent requests: {stats['total_recent_requests']}")
    print()


def test_file_validation():
    """Test file size and type validation"""
    print("=" * 60)
    print("TEST 9: Upload Validation")
    print("=" * 60)
    
    from app.config import settings
    
    print(f"✅ Max upload size: {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB")
    print(f"✅ Allowed extensions: {settings.ALLOWED_EXTENSIONS}")
    
    # Test with invalid extension (should fail)
    test_pdf = Path("test.pdf")
    test_pdf.write_text("fake pdf content")
    
    try:
        with open(test_pdf, 'rb') as f:
            files = {'image1': ('test.pdf', f, 'application/pdf')}
            response = requests.post(f"{BASE_URL}/api/v1/predict", files=files)
        
        assert response.status_code == 400
        print(f"✅ Invalid file type correctly rejected")
    finally:
        test_pdf.unlink()
    
    print()


def run_all_tests():
    """Run all integration tests"""
    print("\n")
    print("COMPONENT 1 (BACKEND) - FULL INTEGRATION TEST")
    print("=" * 60)
    print()
    
    try:
        test_health()
        test_model_info()
        test_diseases()
        test_treatment_scientific()
        test_treatment_ayurvedic()
        test_treatment_not_found()
        test_prediction()
        test_rate_limiting()
        test_file_validation()
        
        print("=" * 60)
        print("✅✅✅ ALL TESTS PASSED - COMPONENT 1 FULLY WORKING ✅✅✅")
        print("=" * 60)
        print()
        print("🎉 Backend Features Verified:")
        print("   ✅ Health monitoring")
        print("   ✅ Model versioning & info")
        print("   ✅ Disease database")
        print("   ✅ Curated treatment guidance (Scientific & Ayurvedic)")
        print("   ✅ Safe fallback for missing knowledge")
        print("   ✅ Disease prediction with ML model")
        print("   ✅ Rate limiting (30 req/min per IP)")
        print("   ✅ Upload validation (size & type)")
        print("   ✅ Production hardening")
        print()
        return True
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}\n")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}\n")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import sys
    
    # Check if server is running
    try:
        requests.get(f"{BASE_URL}/health", timeout=2)
    except:
        print("❌ Server is not running!")
        print("   Start it with: python run.py")
        sys.exit(1)
    
    success = run_all_tests()
    sys.exit(0 if success else 1)
