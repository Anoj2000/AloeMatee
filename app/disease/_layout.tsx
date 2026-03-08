import { Stack } from 'expo-router';
import { Colors } from '@/constants';

export default function DiseaseLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.detection,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="camera-capture" options={{ title: 'Capture Images' }} />
      <Stack.Screen name="upload" options={{ title: 'Upload Images' }} />
    </Stack>
  );
}
