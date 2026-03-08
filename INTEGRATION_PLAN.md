# IoT Environmental Monitoring Integration Plan

## 📊 Current State Analysis

### Your Friend's IoT Project (`aloemate-project/`)
**Structure:**
- **Backend** (Node.js/Express) - Port 5000
  - MongoDB for sensor data storage
  - Routes: `/api/readings`, `/api/predictions`, `/api/alerts`
  - Models: SensorReading, Prediction, Alert
  
- **ML Service** (Python/FastAPI) - Separate service
  - Disease prediction from environmental data
  - Uses `aloevera_disease_model.pkl`
  - Endpoint: `/predict` (temperature, humidity, soilMoisture)
  
- **Mobile App** (React Native/Expo)
  - Tabs: Home, Monitoring, Alerts, Explore
  - Real-time sensor data display (3-second refresh)
  - Device ID: "DEV001"

### Your Current AloeVeraMate Project
**Structure:**
- **Backend** (Python/FastAPI) - Port 8000
  - Image-based disease detection (EfficientNetV2-S)
  - Harvest assessment (leaf length measurement)
  - Knowledge base with treatment recommendations
  
- **Mobile App** (React Native/Expo)
  - Tabs: Home, Harvest, Disease, Knowledge
  - Camera-based disease detection
  - Leaf maturity assessment with card calibration

## ✅ Integration Strategy

### Option 1: Full Integration (Recommended)
Merge IoT functionality into your existing AloeVeraMate project as **Component 2**.

### Option 2: Separate Services
Keep as microservices but add unified API gateway.

---

## 🔧 OPTION 1: Full Integration Steps

### Phase 1: Backend Integration (Python FastAPI)

#### 1.1 Add MongoDB Support to Your Backend
```bash
cd apps/server
pip install pymongo motor  # Async MongoDB driver for FastAPI
```

#### 1.2 Create IoT Module Structure
```
apps/server/app/
├── api/
│   ├── disease.py (existing)
│   ├── harvest.py (existing)
│   ├── iot.py (NEW - sensor readings & predictions)
│   └── knowledge.py (existing)
├── models/
│   ├── iot_models.py (NEW - SensorReading, IoTPrediction, Alert)
├── services/
│   ├── inference.py (existing)
│   ├── iot_prediction.py (NEW - environmental disease prediction)
│   └── alert_service.py (NEW - threshold alerts)
└── ml_models/
    └── iot_disease_model.pkl (copy from aloemate-project)
```

#### 1.3 Database Setup
**Add to `.env`:**
```env
MONGODB_URI=mongodb://localhost:27017/aloemate
```

**Create `apps/server/app/config/database.py`:**
```python
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None

db = Database()

async def get_database():
    return db.client.aloemate

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGODB_URI)
    print("Connected to MongoDB")

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")
```

#### 1.4 Create IoT API Routes
**`apps/server/app/api/iot.py`:**
```python
from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.schemas import SensorReadingCreate, IoTPredictionResponse
from app.services.iot_prediction import predict_from_environment
from app.services.alert_service import check_and_create_alerts

router = APIRouter(prefix="/api/v1/iot", tags=["IoT Monitoring"])

@router.post("/readings")
async def create_sensor_reading(reading: SensorReadingCreate):
    """Store sensor reading and predict disease risk"""
    # 1. Save to MongoDB
    db = await get_database()
    reading_doc = await db.sensor_readings.insert_one({
        "deviceId": reading.deviceId,
        "temperature": reading.temperature,
        "humidity": reading.humidity,
        "soilMoisture": reading.soilMoisture,
        "recordedAt": datetime.utcnow()
    })
    
    # 2. Predict disease from environment
    prediction = predict_from_environment(
        reading.temperature, 
        reading.humidity, 
        reading.soilMoisture
    )
    
    # 3. Save prediction
    pred_doc = await db.predictions.insert_one({
        "deviceId": reading.deviceId,
        "readingId": reading_doc.inserted_id,
        "disease": prediction.disease,
        "confidence": prediction.confidence,
        "timestamp": datetime.utcnow()
    })
    
    # 4. Check for alerts
    alert = await check_and_create_alerts(
        reading.deviceId,
        prediction.disease,
        prediction.confidence,
        reading
    )
    
    return {
        "success": True,
        "reading": {"_id": str(reading_doc.inserted_id)},
        "prediction": prediction,
        "alert": alert
    }

@router.get("/readings/latest")
async def get_latest_reading(deviceId: str):
    """Get latest sensor reading for a device"""
    db = await get_database()
    reading = await db.sensor_readings.find_one(
        {"deviceId": deviceId},
        sort=[("recordedAt", -1)]
    )
    
    if not reading:
        raise HTTPException(status_code=404, detail="No readings found")
    
    return {"success": True, "data": reading}

@router.get("/predictions/latest")
async def get_latest_prediction(deviceId: str):
    """Get latest disease prediction for a device"""
    db = await get_database()
    prediction = await db.predictions.find_one(
        {"deviceId": deviceId},
        sort=[("timestamp", -1)]
    )
    
    return {"success": True, "data": prediction}

@router.get("/alerts")
async def get_alerts(deviceId: str, limit: int = 10):
    """Get recent alerts for a device"""
    db = await get_database()
    alerts = await db.alerts.find(
        {"deviceId": deviceId}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {"success": True, "data": alerts}
```

### Phase 2: Mobile App Integration

#### 2.1 Add IoT Tab to Your App
**Update `apps/mobile/app/(tabs)/_layout.tsx`:**
```tsx
<Tabs.Screen
  name="iot"
  options={{
    title: 'IoT Monitor',
    tabBarIcon: ({ color, focused }) => (
      <TabBarIcon name={focused ? 'wifi' : 'wifi-outline'} color={color} />
    ),
  }}
/>
```

#### 2.2 Create IoT Screens
**`apps/mobile/app/(tabs)/iot/index.tsx`:**
```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.139:8000';
const DEVICE_ID = 'DEV001';

export default function IoTMonitoringScreen() {
  const [reading, setReading] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fetchData = async () => {
    try {
      const [readingRes, predictionRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/iot/readings/latest?deviceId=${DEVICE_ID}`),
        fetch(`${API_BASE_URL}/api/v1/iot/predictions/latest?deviceId=${DEVICE_ID}`)
      ]);
      
      const readingData = await readingRes.json();
      const predictionData = await predictionRes.json();
      
      setReading(readingData.data);
      setPrediction(predictionData.data);
    } catch (error) {
      console.error('Error fetching IoT data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
    >
      {/* Environmental Data Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌡️ Environmental Conditions</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Temperature</Text>
          <Text style={styles.metricValue}>
            {reading ? `${reading.temperature}°C` : '--'}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Humidity</Text>
          <Text style={styles.metricValue}>
            {reading ? `${reading.humidity}%` : '--'}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Soil Moisture</Text>
          <Text style={styles.metricValue}>
            {reading ? `${reading.soilMoisture}%` : '--'}
          </Text>
        </View>
      </View>
      
      {/* Disease Risk Prediction Card */}
      {prediction && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Disease Risk Prediction</Text>
          <View style={styles.predictionBox}>
            <Text style={styles.diseaseText}>{prediction.disease}</Text>
            <Text style={styles.confidenceText}>
              {(prediction.confidence * 100).toFixed(0)}% Confidence
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
```

### Phase 3: ML Model Integration

#### 3.1 Copy IoT Disease Model
```bash
cp "F:\Y4 Projects\AloeVeraMate\aloemate-project\ml-service\aloevera_disease_model.pkl" "F:\Y4 Projects\AloeVeraMate\apps\server\app\ml_models\iot_disease_model.pkl"
```

#### 3.2 Create IoT Prediction Service
**`apps/server/app/services/iot_prediction.py`:**
```python
import joblib
import numpy as np
from pathlib import Path
from typing import Dict

MODEL_PATH = Path(__file__).parent.parent / "ml_models" / "iot_disease_model.pkl"

class IoTPredictionService:
    def __init__(self):
        self.model = joblib.load(MODEL_PATH)
    
    def predict_from_environment(
        self, 
        temperature: float, 
        humidity: float, 
        soil_moisture: float
    ) -> Dict[str, any]:
        """Predict disease risk from environmental conditions"""
        X = np.array([[temperature, humidity, soil_moisture]], dtype=float)
        
        disease = self.model.predict(X)[0]
        
        confidence = 1.0
        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(X)[0]
            confidence = float(np.max(proba))
        
        return {
            "disease": str(disease),
            "confidence": confidence,
            "environmental_factors": {
                "temperature": temperature,
                "humidity": humidity,
                "soil_moisture": soil_moisture
            }
        }

# Global instance
iot_predictor = IoTPredictionService()

def predict_from_environment(temp: float, humidity: float, moisture: float):
    return iot_predictor.predict_from_environment(temp, humidity, moisture)
```

## 🎯 Benefits of Integration

### 1. **Unified User Experience**
- Single app for all aloe vera care needs
- Consistent UI/UX across all features
- Single account/authentication

### 2. **Combined Intelligence**
- Image-based disease detection (Component 1)
- Environmental disease risk prediction (Component 2)
- Cross-validation: "Your environment shows high disease risk, confirm with photo"

### 3. **Comprehensive Monitoring**
- Real-time environmental tracking
- Historical trends and patterns
- Predictive alerts before visible symptoms

### 4. **Better Treatment Recommendations**
- Combine image diagnosis with environmental conditions
- Contextualized advice (e.g., "Reduce watering in high humidity")

## 📋 Implementation Checklist

### Backend Tasks
- [ ] Install MongoDB and Motor
- [ ] Create database connection module
- [ ] Create IoT API routes (`iot.py`)
- [ ] Copy and integrate IoT disease model
- [ ] Create IoT prediction service
- [ ] Create alert service
- [ ] Add MongoDB models (SensorReading, Prediction, Alert)
- [ ] Update main.py to include IoT routes
- [ ] Test endpoints with Postman/curl

### Mobile App Tasks
- [ ] Add IoT tab to navigation
- [ ] Create IoT monitoring screen
- [ ] Create alerts screen
- [ ] Add device configuration screen
- [ ] Implement real-time data refresh
- [ ] Add charts/graphs for historical data (optional)
- [ ] Test with simulated sensor data

### Integration Testing
- [ ] Test sensor data submission
- [ ] Test disease prediction from environment
- [ ] Test alert generation
- [ ] Test real-time updates in mobile app
- [ ] Test combination with image-based detection

## 🚀 Quick Start Commands

### 1. Install Dependencies
```bash
# Backend
cd "F:\Y4 Projects\AloeVeraMate\apps\server"
pip install pymongo motor

# Mobile (if new packages needed)
cd "F:\Y4 Projects\AloeVeraMate\apps\mobile"
npm install
```

### 2. Setup MongoDB
```bash
# Install MongoDB Community Edition (if not installed)
# Or use MongoDB Atlas (cloud)

# Start MongoDB locally
mongod --dbpath="F:\Y4 Projects\AloeVeraMate\data\db"
```

### 3. Copy IoT Model
```bash
cp "F:\Y4 Projects\AloeVeraMate\aloemate-project\ml-service\aloevera_disease_model.pkl" "F:\Y4 Projects\AloeVeraMate\apps\server\app\ml_models\iot_disease_model.pkl"
```

### 4. Test with Simulated Data
```python
# Test script: test_iot.py
import requests

API_URL = "http://localhost:8000/api/v1/iot"

# Simulate sensor reading
reading = {
    "deviceId": "DEV001",
    "temperature": 28.5,
    "humidity": 65.0,
    "soilMoisture": 45.0
}

response = requests.post(f"{API_URL}/readings", json=reading)
print(response.json())
```

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │  Home    │  Disease │  Harvest │  IoT Monitor (NEW)│  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────────┐
│         FastAPI Backend (Port 8000)                      │
│  ┌──────────────┬───────────────┬──────────────────┐    │
│  │ Image-Based  │ Harvest       │ IoT Routes (NEW) │    │
│  │ Detection    │ Assessment    │ /readings        │    │
│  │              │               │ /predictions     │    │
│  │              │               │ /alerts          │    │
│  └──────────────┴───────────────┴──────────────────┘    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ML Models:                                        │   │
│  │ • EfficientNetV2-S (image detection)             │   │
│  │ • IoT Disease Model (environmental prediction)   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    MongoDB                               │
│  ┌──────────────────┬───────────────┬───────────────┐   │
│  │ sensor_readings  │ predictions   │ alerts        │   │
│  └──────────────────┴───────────────┴───────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 💡 Next Steps

1. **Review this plan** and confirm integration approach
2. **Start with backend** - easier to test in isolation
3. **Add mobile UI** once backend is working
4. **Test with real sensor** or simulation
5. **Iterate and refine** based on testing

Would you like me to start implementing any specific part?
