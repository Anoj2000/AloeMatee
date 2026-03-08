import { Stack } from 'expo-router';
import { Colors } from '@/constants';

export default function CarePlanLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.careplan,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Care Plan' }} />
      <Stack.Screen name="schedule" options={{ title: 'Treatment Schedule' }} />
      <Stack.Screen name="chatbot" options={{ title: 'AloeMate Assistant' }} />
    </Stack>
  );
}
