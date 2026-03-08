# Server Development Guide

## Architecture Overview

The FastAPI backend is organized into a clean, modular structure:

- **app/main.py**: Application entry point and configuration
- **app/config.py**: Environment-based settings
- **app/schemas.py**: Pydantic models for request/response validation
- **app/api/**: API endpoint handlers
- **app/services/**: Business logic and ML inference

## Adding New Endpoints

1. Create endpoint handler in `app/api/`
2. Define Pydantic schemas in `app/schemas.py`
3. Add business logic in `app/services/`
4. Register router in `app/main.py`

## Integrating Real ML Model

Replace mock predictions in `app/services/disease_prediction.py`:

```python
import torch
from torchvision import transforms

class DiseasePredictor:
    def __init__(self):
        self.model = torch.load("path/to/model.pt")
        self.model.eval()
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])
    
    async def predict(self, image_path: str) -> DiseaseResponse:
        from PIL import Image
        
        # Load and preprocess image
        image = Image.open(image_path).convert('RGB')
        image_tensor = self.transform(image).unsqueeze(0)
        
        # Run inference
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
        
        # Get top-3 predictions
        top_probs, top_indices = torch.topk(probabilities, 3)
        
        predictions = []
        for prob, idx in zip(top_probs[0], top_indices[0]):
            disease_id = self.idx_to_disease[idx.item()]
            predictions.append(
                DiseasePrediction(
                    disease_id=disease_id,
                    disease_name=DISEASE_DATABASE[disease_id]["name"],
                    confidence=prob.item(),
                    description=DISEASE_DATABASE[disease_id]["description"]
                )
            )
        
        # Determine status
        top_confidence = predictions[0].confidence
        status = "High" if top_confidence >= 0.7 else \
                "Medium" if top_confidence >= 0.4 else "Low"
        
        return DiseaseResponse(
            status=status,
            predictions=predictions,
            message="Analysis complete"
        )
```

## Implementing Real RAG

Replace mock treatment in `app/services/treatment.py`:

```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.llms import OpenAI
from langchain.chains import RetrievalQA

class TreatmentService:
    def __init__(self):
        # Initialize vector store
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = Chroma(
            persist_directory="./data/chroma",
            embedding_function=self.embeddings
        )
        
        # Initialize LLM
        self.llm = OpenAI(temperature=0)
        
        # Create QA chain
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(
                search_kwargs={"k": 3}
            )
        )
    
    async def get_treatment(
        self,
        disease_id: str,
        treatment_type: str
    ) -> TreatmentResponse:
        # Construct query
        query = f"Provide {treatment_type} treatment for {disease_id} in aloe vera plants. Include steps, warnings, and tips."
        
        # Get RAG response
        result = self.qa_chain.run(query)
        
        # Parse and structure response
        # (Add parsing logic based on your LLM output format)
        
        return TreatmentResponse(...)
```

## Testing

```bash
# Install test dependencies
pip install pytest httpx

# Run tests
pytest tests/

# Test specific file
pytest tests/test_api.py

# With coverage
pytest --cov=app tests/
```

## Deployment

### Using Docker:

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t aloeveramate-api .
docker run -p 8000:8000 aloeveramate-api
```

### Using Cloud Platforms:

- **Heroku**: Add `Procfile`
- **Google Cloud Run**: Use Docker deployment
- **AWS Lambda**: Use Mangum adapter
- **Azure App Service**: Direct Python deployment

## Environment Variables

For production, set these environment variables:

```bash
DEBUG=False
ALLOWED_ORIGINS=["https://your-app.com"]
MODEL_PATH=/path/to/production/model
RAG_ENABLED=True
```
