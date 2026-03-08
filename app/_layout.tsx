import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="detection" />
        <Stack.Screen name="monitoring" />
        <Stack.Screen name="careplan" />
        <Stack.Screen name="harvest" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
