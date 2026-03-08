import http from '../http';

export interface HarvestPrediction {
  optimalDate: string;
  daysRemaining: number;
  confidence: number;
  maturityScore: number;
  marketScore: number;
  recommendation: string;
}

export interface MaturityData {
  stage: 'seedling' | 'juvenile' | 'mature' | 'over-mature';
  ageMonths: number;
  leafLengthCm: number;
  gelThicknessMm: number;
  score: number;
  readyToHarvest: boolean;
  notes: string;
}

export interface MarketTrends {
  currentPrice: number;
  priceUnit: string;
  trend: 'rising' | 'falling' | 'stable';
  forecast: { week: string; price: number; demand: number }[];
  insight: string;
}

export async function getHarvestPrediction(): Promise<HarvestPrediction> {
  const response = await http.get<HarvestPrediction>('/harvest/prediction');
  return response.data;
}

export async function getMaturityData(): Promise<MaturityData> {
  const response = await http.get<MaturityData>('/harvest/maturity');
  return response.data;
}

export async function getMarketTrends(): Promise<MarketTrends> {
  const response = await http.get<MarketTrends>('/harvest/market-trends');
  return response.data;
}
