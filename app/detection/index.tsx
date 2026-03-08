import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants';

export default function DetectionIndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔬</Text>
      <Text style={styles.title}>Plant Disease Detection</Text>
      <Text style={styles.hint}>
        Upload three photos of your Aloe Vera plant to detect diseases and get treatment advice.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => router.push('/detection/upload')}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Upload Images</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  icon: { fontSize: 56, marginBottom: Spacing.md },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  hint: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: Spacing.xl,
  },
  button: {
    backgroundColor: Colors.detection,
    borderRadius: 14,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#fff',
  },
});