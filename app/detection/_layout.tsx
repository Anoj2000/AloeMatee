import { Stack } from 'expo-router';
import { Colors } from '@/constants';

export default function DetectionLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.detection,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Disease Detection' }} />
      <Stack.Screen name="upload" options={{ title: 'Upload Images' }} />
      <Stack.Screen name="result" options={{ title: 'Detection Result' }} />
      <Stack.Screen name="treatment" options={{ title: 'Treatment Guide' }} />
    </Stack>
  );
}
