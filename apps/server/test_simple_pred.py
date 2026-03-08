import requests
from pathlib import Path
from PIL import Image
import numpy as np

# Create test image
test_image = Path('test_simple.jpg')
img = Image.fromarray(np.random.randint(0, 255, (384, 384, 3), dtype=np.uint8))
img.save(test_image)

# Test prediction
try:
    with open(test_image, 'rb') as f:
        response = requests.post('http://localhost:8000/api/v1/predict', files={'image1': ('test.jpg', f, 'image/jpeg')})
    print(f'Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print(f'Request ID: {data["request_id"]}')
        print(f'Num images: {data["num_images_received"]}')
        print(f'Predictions: {len(data["predictions"])}')
        print('SUCCESS!')
    else:
        print(f'Error: {response.text}')
except Exception as e:
    print(f'ERROR: {e}')
    import traceback
    traceback.print_exc()
