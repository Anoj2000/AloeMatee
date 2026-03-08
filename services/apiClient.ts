/**
 * apiClient.ts
 * ────────────
 * Axios-based client for the AloeMate FastAPI AI backend.
 *
 * Exports:
 *   predictDisease(imageUris)           — POST /api/v1/predict
 *   getTreatment(diseaseId, mode)       — GET  /api/v1/diseases/:id/treatment
 */

import axios, { AxiosInstance } from 'axios';
import { Endpoints } from '@/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PredictionItem {
  disease_id: number;
  disease_name: string;
  prob: number;
}

export type ConfidenceStatus = 'HIGH' | 'MEDIUM' | 'LOW';
export type NextStep = 'SHOW_TREATMENT' | 'RETAKE';
export type TreatmentMode = 'SCIENTIFIC' | 'AYURVEDIC';

/** Full response from POST /api/v1/predict */
export interface PredictResponse {
  request_id: string;
  predictions: PredictionItem[];
  confidence_status: ConfidenceStatus;
  recommended_next_step: NextStep;
  symptoms_summary: string;
  /** Only present when confidence_status is 'LOW' */
  retake_message: string | null;
}

/** Full response from GET /api/v1/diseases/:id/treatment */
export interface TreatmentResponse {
  disease_id: number;
  disease_name: string;
  scientific_treatment: string;
  ayurvedic_treatment: string;
  dosage: string;
  warnings: string;
  sources: string[];
}

/**
 * Shaped result returned by getTreatment — surfaces the selected mode's
 * treatment text as `treatment` alongside the full record for reference.
 */
export interface TreatmentResult extends TreatmentResponse {
  /** The treatment text corresponding to the requested mode. */
  treatment: string;
  mode: TreatmentMode;
}

// ── Axios instance ─────────────────────────────────────────────────────────────

const aiClient: AxiosInstance = axios.create({
  baseURL: Endpoints.AI_BASE_URL,
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
  },
});

// Log outgoing requests in development
aiClient.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log('[API] →', config.method?.toUpperCase(), `${config.baseURL ?? ''}${config.url ?? ''}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Normalise error messages from FastAPI detail payloads
aiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('[API] ←', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      console.error('[API] ─── Network Error ───────────────────────');
      console.error('[API] message :', error.message);
      console.error('[API] code    :', error.code ?? 'none');
      console.error('[API] url     :', error.config?.url ?? 'unknown');
      console.error('[API] baseURL :', error.config?.baseURL ?? 'unknown');
      console.error('[API] status  :', error.response?.status ?? 'no-response');
      console.error('[API] data    :', JSON.stringify(error.response?.data ?? null, null, 2));
      console.error('[API] ─────────────────────────────────────────');
    }
    // No response at all → server unreachable
    if (!error.response) {
      return Promise.reject(
        new Error(
          `Cannot reach the AI server at ${Endpoints.AI_BASE_URL}. ` +
          'Make sure the FastAPI backend is running and the device is on the same network.',
        ),
      );
    }
    const detail =
      error.response.data?.detail ??
      error.response.data?.message ??
      error.message ??
      'Unexpected error communicating with the AI service.';
    return Promise.reject(new Error(String(detail)));
  },
);

// ── predictDisease ────────────────────────────────────────────────────────────

/**
 * Run the 3-stage disease detection pipeline.
 *
 * @param imageUris  Array of exactly 3 local file URIs (image1, image2, image3).
 *                   Obtained from expo-image-picker or expo-camera.
 * @returns          Structured prediction result.
 * @throws           Error if the request fails or imageUris.length !== 3.
 */
export async function predictDisease(imageUris: string[]): Promise<PredictResponse> {
  if (imageUris.length !== 3) {
    throw new Error(
      `predictDisease requires exactly 3 image URIs, got ${imageUris.length}.`,
    );
  }

  // Use native fetch (not axios) for multipart uploads.
  // React Native's fetch correctly encodes FormData with a boundary —
  // axios's XHR layer does not reliably do this for file blobs.
  const form = new FormData();

  imageUris.forEach((uri, index) => {
    const fieldName = `image${index + 1}`;
    const filename = uri.split('/').pop() ?? `${fieldName}.jpg`;
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    form.append(fieldName, {
      uri,
      name: filename,
      type: ext === 'png' ? 'image/png' : 'image/jpeg',
    } as unknown as Blob);
  });

  const url = `${Endpoints.AI_BASE_URL}${Endpoints.AI_PREDICT}`;

  if (__DEV__) {
    console.log('[API] → POST (fetch)', url);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      body: form,
      // Do NOT set Content-Type — fetch sets it automatically with the correct boundary
    });
  } catch (networkErr: unknown) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    if (__DEV__) console.error('[API] fetch network error:', msg);
    throw new Error(
      `Cannot reach the AI server at ${Endpoints.AI_BASE_URL}. ` +
      'Make sure the FastAPI backend is running and the device is on the same Wi-Fi network.',
    );
  }

  if (__DEV__) {
    console.log('[API] ←', res.status, url);
  }

  if (!res.ok) {
    let detail = `Server error ${res.status}`;
    try {
      const errBody = await res.json();
      detail = errBody?.detail ?? errBody?.message ?? detail;
    } catch { /* non-JSON body, keep default */ }
    throw new Error(String(detail));
  }

  return res.json() as Promise<PredictResponse>;
}

// ── getTreatment ──────────────────────────────────────────────────────────────

/**
 * Fetch treatment information for a specific disease.
 *
 * @param diseaseId  0-based disease class index (from PredictionItem.disease_id).
 * @param mode       'SCIENTIFIC' — evidence-based chemical treatment.
 *                   'AYURVEDIC'  — traditional / natural treatment.
 * @returns          Full treatment record with a `treatment` field pre-set to
 *                   the selected mode's text and a `mode` field for reference.
 * @throws           Error if the disease ID is not found (404) or the request fails.
 */
export async function getTreatment(
  diseaseId: string | number,
  mode: TreatmentMode,
): Promise<TreatmentResult> {
  const response = await aiClient.get<TreatmentResponse>(
    Endpoints.AI_TREATMENT(diseaseId),
  );

  const data = response.data;

  return {
    ...data,
    treatment:
      mode === 'SCIENTIFIC' ? data.scientific_treatment : data.ayurvedic_treatment,
    mode,
  };
}
