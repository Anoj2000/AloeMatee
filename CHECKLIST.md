# ✅ Clone & Run Checklist

Quick reference for deploying AloeVeraMate on a new PC.

## Before Cloning

- [ ] Install **Node.js** (v18+)
- [ ] Install **Python** (v3.10+)
- [ ] Install **Git**
- [ ] Download **Expo Go** app on mobile device (optional)
- [ ] Create **MongoDB Atlas** account (for IoT features)

## After Cloning

### Backend Setup
- [ ] Navigate to `apps/server`
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate venv: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Copy `.env.example` to `.env`
- [ ] Update `MONGODB_URI` in `.env` with your MongoDB connection string
- [ ] Download disease detection model to `artifacts/model.pt` (see artifacts/README.md)
- [ ] *Optional*: Download harvest ML model to `app/ml_models/harvest_model.h5`
- [ ] Start server: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
- [ ] Verify: Open http://localhost:8000/docs

### Mobile Setup
- [ ] Navigate to `apps/mobile`
- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Find your IP address: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- [ ] Update `EXPO_PUBLIC_API_URL` in `.env` with `http://YOUR_IP:8000`
- [ ] Start Expo: `npx expo start`
- [ ] Scan QR code with Expo Go app

### Verification
- [ ] Backend API docs load at http://localhost:8000/docs
- [ ] Mobile app opens in Expo Go
- [ ] Can navigate to Disease Detection screen
- [ ] Can take/select photos
- [ ] Backend responds to API requests
- [ ] IoT dashboard shows "No data" (before posting data)
- [ ] Harvest measurement tools load correctly

## Files NOT in Git (Download Separately)

- `apps/server/artifacts/model.pt` (77.81 MB) - **Required for Component 1**
- `apps/server/app/ml_models/harvest_model.h5` (38.98 MB) - *Optional for Component 4 ML Demo*

## Files INCLUDED in Git

✅ `apps/server/app/ml_models/iot_disease_model.pkl` (2.33 MB) - Small enough to commit
✅ `apps/server/data/diseases.json` - Disease knowledge base
✅ `apps/server/data/knowledge/` - Treatment information
✅ All source code and configurations

## Environment Variables Required

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aloemate
DEBUG=True
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=["*"]
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=http://192.168.X.X:8000
```

## Common Issues

### "Cannot connect to backend"
→ Check IP address in mobile .env matches backend computer's IP
→ Ensure backend is running with `HOST=0.0.0.0`
→ Check firewall allows port 8000

### "MongoDB connection failed"
→ Verify MONGODB_URI format
→ Check IP whitelist in MongoDB Atlas
→ Ensure database user has read/write permissions

### "Model not found"
→ Download model.pt to correct location
→ Check file path matches artifacts/model.pt
→ File size should be ~77.81 MB

---

**See SETUP.md for detailed instructions**
