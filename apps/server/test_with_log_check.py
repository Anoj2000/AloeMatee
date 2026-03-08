import requests
from pathlib import Path
from PIL import Image
import numpy as np
import time

# Create test image
test_image = Path('test_api.jpg')
img = Image.fromarray(np.random.randint(0, 255, (384, 384, 3), dtype=np.uint8))
img.save(test_image)

# Wait a bit for server to be ready
time.sleep(2)

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
        print(f'Error: {response.json()}')
        
    # Now check server logs - print last 30 lines of the new window
    print("\nCheck the PowerShell window for server logs!")
        
except Exception as e:
    print(f'ERROR: {e}')
    import traceback
    traceback.print_exc()
