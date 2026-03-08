"""Test script to verify resolution check in the prediction endpoint."""
import requests
from PIL import Image
import io

def create_test_image(width: int, height: int):
    """Create a test image with specified dimensions."""
    img = Image.new('RGB', (width, height), color='green')
    return img

def image_to_bytes(image: Image.Image) -> bytes:
    """Convert PIL image to bytes."""
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")
    return buffered.getvalue()

def test_resolution_check():
    """Test the resolution check in the prediction endpoint."""
    url = "http://localhost:8000/api/v1/predict"
    
    print("=" * 60)
    print("Testing Image Quality - Resolution Check")
    print("=" * 60)
    
    # Test 1: Low resolution image (should be rejected)
    print("\n1. Testing low resolution image (100x100)...")
    small_img = create_test_image(100, 100)
    img_bytes = image_to_bytes(small_img)
    files = {'image1': ('test.jpg', img_bytes, 'image/jpeg')}
    response = requests.post(url, files=files)
    result = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   Confidence Status: {result.get('confidence_status')}")
    print(f"   Next Step: {result.get('recommended_next_step')}")
    if result.get('retake_message'):
        print(f"   Message: {result['retake_message']}")
    
    # Test 2: Adequate resolution (should pass resolution check)
    print("\n2. Testing adequate resolution image (400x400)...")
    good_img = create_test_image(400, 400)
    img_bytes = image_to_bytes(good_img)
    files = {'image1': ('test.jpg', img_bytes, 'image/jpeg')}
    response = requests.post(url, files=files)
    result = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   Confidence Status: {result.get('confidence_status')}")
    print(f"   Predictions returned: {len(result.get('predictions', []))}")
    if result.get('retake_message'):
        print(f"   Message: {result['retake_message']}")
    
    # Test 3: Borderline resolution (224x224 - minimum)
    print("\n3. Testing borderline resolution (224x224 - minimum)...")
    borderline_img = create_test_image(224, 224)
    img_bytes = image_to_bytes(borderline_img)
    files = {'image1': ('test.jpg', img_bytes, 'image/jpeg')}
    response = requests.post(url, files=files)
    result = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   Confidence Status: {result.get('confidence_status')}")
    print(f"   Predictions returned: {len(result.get('predictions', []))}")
    if result.get('retake_message'):
        print(f"   Message: {result['retake_message']}")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_resolution_check()
    except Exception as e:
        print(f"Error: {e}")
