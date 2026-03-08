import http from '../http';

export interface DetectionResult {
  disease: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface TreatmentGuide {
  disease: string;
  steps: { step: number; title: string; description: string }[];
  products: string[];
  preventionTips: string[];
}

export async function analyzePlantImage(imageUri: string): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'plant.jpg',
  } as any);

  const response = await http.post<DetectionResult>('/detection/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getTreatmentGuide(disease: string): Promise<TreatmentGuide> {
  const response = await http.get<TreatmentGuide>(`/detection/treatment/${encodeURIComponent(disease)}`);
  return response.data;
}
