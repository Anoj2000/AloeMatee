# 🎯 Getting Started with AloeVeraMate

Welcome! Your monorepo has been created. Follow these steps to get everything running.

## ⚠️ Current Status

The project structure is complete, but **dependencies are not yet installed**. This is normal!

## 🚀 Installation Steps

### Option 1: Automated Setup (Recommended)

Run the setup script for your platform:

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- ✅ Create Python virtual environment
- ✅ Install all Python dependencies
- ✅ Install all Node.js dependencies
- ✅ Create `.env` files from templates

### Option 2: Manual Setup

**Step 1: Backend Setup**
```bash
cd apps/server
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux
```

**Step 2: Mobile Setup**
```bash
cd apps/mobile
npm install

# Create environment file
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux
```

## 📝 Important Configuration

### Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**macOS/Linux:**
```bash
ifconfig
# or
ip addr
```
Look for "inet" under your active network interface.

### Update Mobile App Configuration

Edit `apps/mobile/.env` and update the API URL:

```env
# Replace 192.168.1.100 with YOUR computer's IP address
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

**Special Cases:**
- **Android Emulator**: Use `http://10.0.2.2:8000`
- **iOS Simulator**: Use `http://localhost:8000`
- **Physical Device**: Use `http://YOUR_IP:8000`

## 🎮 Running the Application

You need **two terminal windows** running simultaneously.

### Terminal 1: Start Backend

```bash
cd apps/server

# Activate virtual environment
venv\Scripts\activate         # Windows
source venv/bin/activate      # macOS/Linux

# Start server
python run.py
```

✅ Backend should be running at: http://localhost:8000

You can test it by opening http://localhost:8000/docs in your browser.

### Terminal 2: Start Mobile App

```bash
cd apps/mobile
npm start
```

This will:
1. Start the Expo development server
2. Show a QR code in the terminal
3. Open Expo Dev Tools in your browser

### Run on Your Phone

1. **Install Expo Go** on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan the QR code:**
   - **iOS**: Open Camera app and scan
   - **Android**: Open Expo Go app and use built-in scanner

3. **Wait for the app to load** on your phone

4. **Make sure your phone and computer are on the same WiFi network**

## ✅ Verify Everything Works

1. **Backend Health Check:**
   - Open browser: http://localhost:8000/health
   - Should see: `{"status": "healthy", ...}`

2. **Backend API Docs:**
   - Open browser: http://localhost:8000/docs
   - Should see Swagger UI with endpoints

3. **Mobile App:**
   - Should see the home screen with "🌿 AloeVeraMate" title
   - Tap "Start Diagnosis" to test navigation

## 🐛 Troubleshooting

### "Cannot connect to backend"

**Solution:**
1. Verify backend is running (check Terminal 1)
2. Check `apps/mobile/.env` has correct IP address
3. Ensure phone and computer on same WiFi
4. Try disabling Windows Firewall temporarily
5. On Windows, allow Python through firewall when prompted

### "Module not found" errors

**Mobile App:**
```bash
cd apps/mobile
rm -rf node_modules        # or rmdir /s node_modules on Windows
npm install
npm start -- --clear
```

**Backend:**
```bash
cd apps/server
pip install --upgrade pip
pip install -r requirements.txt
```

### Python "command not found"

**Windows:**
- Try `python` or `py` instead of `python3`
- Install Python from: https://www.python.org/downloads/

**macOS/Linux:**
- Use `python3` instead of `python`
- Install via: `brew install python` (macOS) or your package manager

### Expo QR code not working

1. Press `r` in the Expo terminal to reload
2. Try entering the URL manually in Expo Go
3. Use `npm start -- --tunnel` for tunnel connection
4. Check Expo Dev Tools in browser for alternative connection methods

## 📚 Next Steps

Once everything is running:

1. **Test the App Flow:**
   - Capture or select a plant image
   - View disease predictions
   - Choose treatment type (Scientific/Ayurvedic)
   - View treatment guidance

2. **Explore the Code:**
   - Mobile: `apps/mobile/src/screens/`
   - Backend: `apps/server/app/api/`
   - Types: `shared/types/`

3. **Read Documentation:**
   - [README.md](README.md) - Complete documentation
   - [QUICKSTART.md](QUICKSTART.md) - Quick reference
   - [apps/server/DEVELOPMENT.md](apps/server/DEVELOPMENT.md) - Backend development guide

4. **Integrate Real ML Model:**
   - Replace mock in `apps/server/app/services/disease_prediction.py`

5. **Implement Real RAG:**
   - Replace mock in `apps/server/app/services/treatment.py`

## 🎓 Learn More

- **Expo Documentation**: https://docs.expo.dev/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Native**: https://reactnative.dev/

## 💡 Quick Commands Reference

```bash
# Start backend
cd apps/server && venv\Scripts\activate && python run.py

# Start mobile
cd apps/mobile && npm start

# Install new Python package
cd apps/server && venv\Scripts\activate && pip install package-name

# Install new npm package
cd apps/mobile && npm install package-name

# Format Python code
cd apps/server && black app/

# Lint mobile code
cd apps/mobile && npm run lint
```

## 🎉 You're Ready!

Follow the steps above and you'll have a fully functional plant disease detection app running in minutes!

If you encounter any issues not covered here, check the [README.md](README.md) for more detailed troubleshooting.

Happy coding! 🌿
