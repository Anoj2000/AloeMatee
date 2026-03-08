import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

interface RiskMeterProps {
  score: number; // 0–100
}

function getRiskLevel(score: number): { label: string; color: string } {
  if (score < 30) return { label: 'Low Risk', color: Colors.success };
  if (score < 60) return { label: 'Moderate Risk', color: Colors.warning };
  return { label: 'High Risk', color: Colors.error };
}

export function RiskMeter({ score }: RiskMeterProps) {
  const { label, color } = getRiskLevel(score);
  const clampedScore = Math.min(100, Math.max(0, score));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Disease Risk Score</Text>
        <Text style={[styles.score, { color }]}>{clampedScore}%</Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clampedScore}%` as any, backgroundColor: color },
          ]}
        />
      </View>

      <Text style={[styles.label, { color }]}>{label}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  title: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  score: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  track: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  fill: { height: '100%', borderRadius: 6 },
  label: { fontSize: Typography.sizes.sm, fontWeight: '500', textAlign: 'right' },
});
