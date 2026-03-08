import http from '../http';

export interface SensorReading {
  id: string;
  label: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface DashboardData {
  riskScore: number;
  sensors: SensorReading[];
  lastUpdated: string;
}

export interface HistoryEntry {
  timestamp: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
}

export async function getSensorData(): Promise<DashboardData> {
  const response = await http.get<DashboardData>('/monitoring/live');
  return response.data;
}

export async function getSensorHistory(): Promise<HistoryEntry[]> {
  const response = await http.get<HistoryEntry[]>('/monitoring/history');
  return response.data;
}
