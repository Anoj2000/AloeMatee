# Production Deployment Guide

Quick reference for deploying AloeVeraMate backend with production hardening enabled.

## ✅ Pre-Deployment Checklist

- [ ] **Configuration**: Set production environment variables
- [ ] **Model Files**: Ensure `artifacts/model.pt` and `model_metadata.json` exist
- [ ] **Knowledge Base**: All treatment files validated
- [ ] **Dependencies**: All packages installed (`pip install -r requirements.txt`)
- [ ] **Tests**: Run `python tests/test_production_hardening.py`
- [ ] **Security**: Review CORS settings, disable DEBUG mode

## 🔧 Environment Configuration

### Production `.env` File

```bash
# Application
APP_NAME="AloeVeraMate API"
APP_VERSION="1.0.0"
DEBUG=false

# Server
HOST=0.0.0.0
PORT=8000

# CORS (specify exact origins in production)
ALLOWED_ORIGINS=["https://yourdomain.com", "https://app.yourdomain.com"]

# File Upload (already optimal)
MAX_UPLOAD_SIZE=10485760  # 10MB

# Rate Limiting (adjust based on traffic)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=30    # per window
RATE_LIMIT_WINDOW=60      # seconds

# ML Model
MODEL_PATH=/path/to/artifacts/model.pt
CONFIDENCE_THRESHOLD=0.3
```

## 🚀 Startup Commands

### Development
```bash
cd apps/server
python run.py
# or
uvicorn app.main:app --reload --port 8000
```

### Production (Single Instance)
```bash
cd apps/server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

### Production (Multiple Workers)
```bash
# Use Gunicorn with Uvicorn workers for better performance
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

### Docker
```bash
docker build -t aloeveramate-api .
docker run -d -p 8000:8000 \
  --env-file .env \
  --name aloeveramate-api \
  aloeveramate-api
```

## 🔍 Health Checks

### Startup Validation
Watch logs during startup for validation status:

```
2026-01-07 08:22:54 - app.main - INFO - 🔒 Validating curated knowledge base...
2026-01-07 08:22:54 - app.main - INFO - ✅ Knowledge base validation passed
2026-01-07 08:22:54 - app.main - INFO - 🤖 Preloading ML models into memory...
2026-01-07 08:22:54 - app.main - INFO - ✅ ML model loaded successfully
2026-01-07 08:22:54 - app.main - INFO -    Model: efficientnetv2-s
2026-01-07 08:22:54 - app.main - INFO -    Version: 1.0.0
2026-01-07 08:22:54 - app.main - INFO -    Type: pytorch
2026-01-07 08:22:54 - app.main - INFO -    Classes: 6
```

### Runtime Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "message": "AloeVeraMate API is running"
}
```

### Model Info Check
```bash
curl http://localhost:8000/api/v1/model_info
```

Verify `model_version` is present:
```json
{
  "model_type": "pytorch",
  "model_name": "efficientnetv2-s",
  "model_version": "1.0.0",
  "num_classes": 6,
  ...
}
```

## 📊 Monitoring

### Check Rate Limiter Stats
```python
from app.services.rate_limiter import get_rate_limiter

rate_limiter = get_rate_limiter()
stats = rate_limiter.get_stats()
print(stats)
```

### Log Analysis
```bash
# Count rate limit violations
grep "Rate limit exceeded" server.log | wc -l

# Count inference errors
grep "Inference failed" server.log | wc -l

# Count successful predictions
grep "Success -" server.log | wc -l
```

## 🛡️ Security Best Practices

### 1. CORS Configuration
```python
# ❌ Don't use in production
ALLOWED_ORIGINS = ["*"]

# ✅ Use specific origins
ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://app.yourdomain.com"
]
```

### 2. HTTPS/TLS
Always use HTTPS in production. Configure reverse proxy (Nginx, Traefik):

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Rate Limiting
Adjust based on expected traffic:

```python
# Low traffic (dev/staging)
RATE_LIMIT_REQUESTS = 30   # 30 req/min

# Medium traffic
RATE_LIMIT_REQUESTS = 100  # 100 req/min

# High traffic (consider Redis-backed limiter)
RATE_LIMIT_REQUESTS = 300  # 300 req/min
```

### 4. File Upload Security
Current settings are secure:
- Max 10MB (prevents DoS)
- Only jpg/jpeg/png (prevents malicious files)
- Files cleaned up after processing (prevents disk exhaustion)

## 🔥 Troubleshooting

### Issue: Server won't start (knowledge validation fails)
```bash
# Check validation errors
python -m app.services.knowledge_validator

# Fix errors in knowledge files
# Ensure all files have:
# - safety_warnings (min 3)
# - when_to_consult_expert (min 3)
# - citations (min 2 with all fields)
```

### Issue: Model loading fails
```bash
# Check model files exist
ls artifacts/model.pt
ls artifacts/model_metadata.json

# Verify metadata format
python -c "import json; print(json.load(open('artifacts/model_metadata.json')))"

# Check PyTorch installation
python -c "import torch; print(torch.__version__)"
```

### Issue: Rate limiting too aggressive
```bash
# Temporarily disable for testing
export RATE_LIMIT_ENABLED=false

# Or increase limits
export RATE_LIMIT_REQUESTS=100
export RATE_LIMIT_WINDOW=60
```

### Issue: High memory usage
- Check number of workers (reduce if needed)
- Verify model is cached (should load once)
- Monitor with `top` or `htop`
- Consider model quantization for smaller memory footprint

### Issue: Slow inference
- Verify model is preloaded at startup
- Check if GPU is being used: `nvidia-smi`
- Consider model optimization (TorchScript, ONNX)
- Profile with `py-spy` or `cProfile`

## 📈 Performance Tuning

### Workers Configuration
```bash
# CPU-bound workload: workers = (2 * CPU_cores) + 1
# For 4-core machine:
--workers 9

# GPU workload: workers = 1-2 (avoid GPU contention)
--workers 1
```

### Timeout Configuration
```bash
# Long-running inference: increase timeout
--timeout 120  # seconds

# Fast inference: shorter timeout
--timeout 30
```

### Memory Limits (Docker)
```bash
docker run -d \
  --memory="2g" \
  --memory-swap="2g" \
  --cpus="2" \
  aloeveramate-api
```

## 🎯 Scaling Strategy

### Vertical Scaling (Single Instance)
1. Increase CPU/RAM
2. Add GPU for faster inference
3. Optimize model (quantization, pruning)

### Horizontal Scaling (Multiple Instances)
1. Deploy multiple instances behind load balancer
2. Use Redis for distributed rate limiting
3. Consider separate inference service (TorchServe)
4. Add response caching (Redis, CDN)

### Example: Load Balancer Setup
```nginx
upstream backend {
    least_conn;  # Use least connections algorithm
    server 10.0.1.10:8000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:8000 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://backend;
        proxy_next_upstream error timeout http_502 http_503;
    }
}
```

## 📝 Monitoring & Alerting

### Key Metrics to Track
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Rate limit hits
- Model inference time
- Memory usage
- CPU usage

### Prometheus Metrics (Future Enhancement)
```python
# TODO: Add prometheus_client
from prometheus_client import Counter, Histogram

prediction_requests = Counter('predictions_total', 'Total predictions')
prediction_latency = Histogram('prediction_duration_seconds', 'Prediction latency')
```

## 🚨 Incident Response

### Server Unresponsive
1. Check health endpoint: `curl http://localhost:8000/health`
2. Review recent logs: `tail -n 100 server.log`
3. Check resource usage: `top`, `free -h`, `df -h`
4. Restart service if needed

### High Error Rate
1. Check logs for error patterns
2. Verify model files intact
3. Check knowledge base validation
4. Review rate limiting stats
5. Check disk space and memory

### Rate Limit Abuse
1. Identify IPs in logs: `grep "Rate limit exceeded" server.log`
2. Review rate limiter stats
3. Adjust limits if legitimate traffic
4. Block malicious IPs at firewall level

## 📞 Support

For issues or questions:
- Check logs: `tail -f server.log`
- Run tests: `python tests/test_production_hardening.py`
- Review [README.md](README.md) Production Hardening section
- Check [GitHub Issues](https://github.com/your-repo/issues)

---

**Last Updated**: 2026-01-07  
**Version**: 1.0.0  
**Hardening Status**: ✅ Production Ready
