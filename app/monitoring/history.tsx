import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

export default function SensorHistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>??</Text>
      <Text style={styles.title}>Sensor History</Text>
      <Text style={styles.hint}>
        Charts showing the last 7 days of temperature, humidity, and soil moisture readings.
      </Text>
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
  },
});