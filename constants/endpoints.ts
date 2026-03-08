// Replace with your actual backend base URL
// Use env vars in production: process.env.EXPO_PUBLIC_API_URL
export const Endpoints = {
  API_BASE_URL: 'https://api.aloemate.app/v1',

  // ── AI backend (FastAPI) ──────────────────────────────────────────────────
  // Development: point to your local machine IP visible from the device/emulator
  AI_BASE_URL: process.env.EXPO_PUBLIC_AI_BASE_URL ?? 'http://192.168.8.194:8000',

  // POST /api/v1/predict  — 3-image disease detection
  AI_PREDICT: '/api/v1/predict',

  // GET  /api/v1/diseases/:id/treatment
  AI_TREATMENT: (diseaseId: string | number) =>
    `/api/v1/diseases/${encodeURIComponent(String(diseaseId))}/treatment`,

  // GET  /api/v1/diseases  — list all diseases
  AI_DISEASES: '/api/v1/diseases',

  // Detection
  DETECT_ANALYZE:   '/detection/analyze',
  DETECT_TREATMENT: '/detection/treatment',

  // Monitoring
  MONITORING_LIVE:    '/monitoring/live',
  MONITORING_HISTORY: '/monitoring/history',

  // Care Plan
  CAREPLAN:       '/careplan',
  CAREPLAN_TASKS: '/careplan/tasks',
  CHATBOT:        '/chatbot/message',

  // Harvest
  HARVEST_PREDICTION:    '/harvest/prediction',
  HARVEST_MATURITY:      '/harvest/maturity',
  HARVEST_MARKET_TRENDS: '/harvest/market-trends',
};
