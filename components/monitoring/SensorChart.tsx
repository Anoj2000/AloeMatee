import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

interface DataPoint {
  label: string;
  value: number;
}

interface SensorChartProps {
  title: string;
  data: DataPoint[];
  color: string;
}

export function SensorChart({ title, data, color }: SensorChartProps) {
  const max = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chart}>
          {data.map((point, index) => {
            const heightPct = max > 0 ? (point.value / max) * 100 : 0;
            return (
              <View key={index} style={styles.barGroup}>
                <Text style={styles.barValue}>{point.value}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${heightPct}%` as any, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{point.label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: Spacing.sm,
  },
  barGroup: { alignItems: 'center', width: 40 },
  barValue: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginBottom: 2 },
  barTrack: { width: 20, height: 80, justifyContent: 'flex-end' },
  bar: { width: 20, borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 9, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
});
