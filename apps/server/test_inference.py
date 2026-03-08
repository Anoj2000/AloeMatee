import requests
import json
from pathlib import Path

# Test with a healthy plant image
dataset_root = Path(r"F:\Y4 Projects\AloeVeraMate\dataset\Aloe Vera Leaf Disease Detection Dataset")
test_image = dataset_root / "Healthy" / "processed_img_Healthy111.jpeg"

if not test_image.exists():
    print(f"Test image not found: {test_image}")
    exit(1)

print("Testing /predict endpoint...")
print(f"Using image: {test_image.name}\n")

try:
    with open(test_image, 'rb') as f:
        files = {'image1': (test_image.name, f, 'image/jpeg')}
        response = requests.post(
            "http://localhost:8000/api/v1/predict",
            files=files,
            timeout=30
        )
    
    print(f"Status: {response.status_code}\n")
    
    if response.status_code == 200:
        result = response.json()
        print("=" * 60)
        print("PREDICTION RESULTS")
        print("=" * 60)
        print(f"Request ID: {result['request_id']}")
        print(f"Confidence Status: {result['confidence_status']}")
        print(f"Recommended Action: {result['recommended_next_step']}")
        print(f"\nSymptoms Summary:\n{result['symptoms_summary']}")
        
        if result.get('retake_message'):
            print(f"\nRetake Message:\n{result['retake_message']}")
        
        print(f"\nTop 3 Predictions:")
        print("-" * 60)
        for i, pred in enumerate(result['predictions'][:3], 1):
            print(f"{i}. {pred['disease_name']}: {pred['prob']*100:.2f}%")
        print("=" * 60)
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")
