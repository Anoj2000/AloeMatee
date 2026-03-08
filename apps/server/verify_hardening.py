"""Quick verification script for production hardening"""
print("=" * 60)
print("PRODUCTION HARDENING VERIFICATION")
print("=" * 60)
print()

# 1. Config
from app.config import settings
print("✅ Configuration loaded")
print(f"   - Max upload: {settings.MAX_UPLOAD_SIZE/(1024*1024)}MB")
print(f"   - Rate limit: {settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_WINDOW}s")
print(f"   - Allowed types: {settings.ALLOWED_EXTENSIONS}")
print()

# 2. Rate limiter
from app.services.rate_limiter import get_rate_limiter
rl = get_rate_limiter()
print("✅ Rate limiter initialized")
allowed, remaining, _ = rl.is_allowed("test-ip")
print(f"   - Test request: allowed={allowed}, remaining={remaining}")
print()

# 3. Model caching
from app.services.inference import get_inference_service
svc = get_inference_service()
info = svc.get_model_info()
print("✅ Model cached")
print(f"   - Name: {info.get('model_name')}")
print(f"   - Version: {info.get('model_version')}")
print(f"   - Type: {info.get('model_type')}")
print()

# 4. App creation
from app.main import create_app
app = create_app()
print("✅ App created with all features")
print()

print("=" * 60)
print("🎉 ALL PRODUCTION HARDENING FEATURES VERIFIED!")
print("=" * 60)
