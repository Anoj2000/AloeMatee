import { Stack } from 'expo-router';
import { Colors } from '@/constants';

export default function MonitoringLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.monitoring,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'IoT Monitoring' }} />
      <Stack.Screen name="risk-alert" options={{ title: 'Risk Alert' }} />
      <Stack.Screen name="history" options={{ title: 'Sensor History' }} />
    </Stack>
  );
}
