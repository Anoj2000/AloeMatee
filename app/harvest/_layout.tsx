import { Stack } from 'expo-router';
import { Colors } from '@/constants';

export default function HarvestLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.harvest,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Harvest Prediction' }} />
      <Stack.Screen name="maturity" options={{ title: 'Plant Maturity' }} />
      <Stack.Screen name="market-trends" options={{ title: 'Market Trends' }} />
    </Stack>
  );
}
