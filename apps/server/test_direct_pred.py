import asyncio
from pathlib import Path
from PIL import Image
import numpy as np

# Create test image
test_image = Path('test_direct.jpg')
img = Image.fromarray(np.random.randint(0, 255, (384, 384, 3), dtype=np.uint8))
img.save(test_image)

# Test prediction service directly
from app.services.disease_prediction import disease_predictor

async def test():
    try:
        result = await disease_predictor.predict_multiple([str(test_image)])
        print(f'SUCCESS!')
        print(f'Request ID: {result.request_id}')
        print(f'Num images: {result.num_images_received}')
        print(f'Predictions: {len(result.predictions)}')
        print(f'Confidence: {result.confidence_status}')
    except Exception as e:
        print(f'ERROR: {e}')
        import traceback
        traceback.print_exc()

asyncio.run(test())
