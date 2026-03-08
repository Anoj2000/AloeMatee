# 🌿 AloeVeraMate - Setup Guide

This guide will help you clone and run the entire AloeVeraMate application on a different PC.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **Python** (v3.10 or later) - [Download](https://www.python.org/)
- **Git** - [Download](https://git-scm.com/)
- **Expo Go App** (for mobile testing) - Download from App Store/Google Play

### Optional
- **MongoDB Atlas Account** (for IoT features) - [Sign up](https://www.mongodb.com/cloud/atlas/register)
- **Android Studio** / **Xcode** (for native builds)

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd AloeVeraMate
```

### 2️⃣ Backend Setup

```bash
# Navigate to server directory
cd apps/server

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
copy .env.example .env       # Windows
cp .env.example .env         # macOS/Linux

# Edit .env file with your configuration (see below)

# Download ML models (if not included)
# The disease detection model (77.81 MB) needs to be downloaded separately
# See artifacts/README.md for download instructions
```

#### Configure Backend .env
Edit `apps/server/.env`:

```env
# Required: MongoDB connection for IoT features
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/aloemate

# Optional: Adjust as needed
DEBUG=True
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=["*"]
```

#### Start Backend Server

```bash
# Option 1: Using batch script (Windows)
start_server.bat

# Option 2: Direct command
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Server will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 3️⃣ Mobile App Setup

```bash
# Navigate to mobile directory
cd apps/mobile

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env       # Windows
cp .env.example .env         # macOS/Linux

# Edit .env file with your backend URL (see below)

# Start Expo development server
npx expo start
```

#### Configure Mobile .env
Edit `apps/mobile/.env`:

```env
# Replace with your computer's IP address (important for physical devices!)
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:8000

# Examples:
# Android Emulator: http://10.0.2.2:8000
# iOS Simulator: http://localhost:8000
# Physical Device on same WiFi: http://192.168.1.XXX:8000
```

**How to find your IP address:**
- **Windows**: Run `ipconfig` in CMD, look for IPv4 Address
- **macOS/Linux**: Run `ifconfig` or `ip addr show`

### 4️⃣ Test the Application

1. **Backend**: Open http://localhost:8000/docs to see API documentation
2. **Mobile**: Scan QR code with Expo Go app or press `a` for Android / `i` for iOS simulator
3. **Test Components**:
   - Component 1: Disease Detection (camera/gallery)
   - Component 2: IoT Monitoring (requires MongoDB setup)
   - Component 4: Harvest Assessment (measurement-based + ML demo)

## 📦 Large Files Not Included in Git

The following files are **NOT** included in the repository due to size:

### Disease Detection Model (77.81 MB)
- **Location**: `apps/server/artifacts/model.pt`
- **Required for**: Component 1 (Disease Detection)
- **Download**: See `apps/server/artifacts/README.md` for instructions

### Harvest ML Model (38.98 MB)
- **Location**: `apps/server/app/ml_models/harvest_model.h5`
- **Required for**: Component 4 ML Demo (optional)
- **Note**: Measurement-based harvest assessment works without this

### IoT Prediction Model (2.33 MB) ✅
- **Location**: `apps/server/app/ml_models/iot_disease_model.pkl`
- **Status**: INCLUDED in repository (small enough)
- **Required for**: Component 2 (IoT Environmental Monitoring)

## 🔧 MongoDB Setup (for IoT Features)

### Option 1: MongoDB Atlas (Recommended - Free Tier Available)

1. Create account at https://www.mongodb.com/cloud/atlas/register
2. Create a new cluster (free tier is sufficient)
3. Create database user with password
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string: Clusters → Connect → Connect your application
6. Copy connection string to `apps/server/.env` as `MONGODB_URI`

### Option 2: Local MongoDB

```bash
# Install MongoDB Community Edition
# https://www.mongodb.com/try/download/community

# Start MongoDB service
# Windows: Run as service or use MongoDB Compass
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Connection string in .env:
MONGODB_URI=mongodb://localhost:27017/aloemate
```

## 🎯 Component Status

| Component | Name | Dependencies | Status |
|-----------|------|--------------|--------|
| 1 | Disease Detection | model.pt (download) | ✅ Ready |
| 2 | IoT Monitoring | MongoDB, iot_disease_model.pkl | ✅ Ready |
| 3 | Treatment Recommendations | diseases.json (included) | ✅ Ready |
| 4 | Harvest Assessment | None (measurement-based) | ✅ Ready |
| 4 (ML Demo) | ML-Based Assessment | harvest_model.h5 (optional) | ⚠️ Optional |

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check if port 8000 is in use
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # macOS/Linux
```

### Mobile can't connect to backend
```bash
# Make sure backend is running
# Check firewall allows connections on port 8000
# Verify IP address in mobile .env matches backend IP
# Use your local network IP, not localhost (for physical devices)
```

### MongoDB connection fails
```bash
# Verify connection string format
# Check IP whitelist in MongoDB Atlas
# Ensure database user has proper permissions
# Test connection using MongoDB Compass
```

### Model files missing
```bash
# Check artifacts/README.md for download links
# Verify file paths in .env match actual locations
# Ensure files are in correct directories
```

## 📱 Running on Physical Device

1. Connect device to **same WiFi** as your computer
2. Find your computer's IP address (see above)
3. Update `apps/mobile/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
   ```
4. Start backend server (must use `0.0.0.0` as host)
5. Start Expo: `npx expo start`
6. Scan QR code with Expo Go app

## 🎉 Success!

If everything is set up correctly:
- ✅ Backend API docs available at http://localhost:8000/docs
- ✅ Mobile app running in Expo Go
- ✅ Can take photos and get disease predictions
- ✅ IoT monitoring dashboard shows data (if MongoDB configured)
- ✅ Harvest measurement tools work correctly

## 📚 Additional Resources

- **Project Structure**: See `apps/README.md`
- **Backend API**: See `apps/server/README.md`
- **Training Models**: See `apps/training/README.md`
- **Troubleshooting**: Check GitHub Issues

## 🤝 Support

If you encounter issues:
1. Check this setup guide thoroughly
2. Review component-specific README files
3. Ensure all prerequisites are installed
4. Verify environment variables are correctly set
5. Check firewall/network settings

---

**Happy coding! 🌿**
