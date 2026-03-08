import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';
import { StatusBadge } from '@/components/common/StatusBadge';

interface ResultCardProps {
  disease: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
}

const SEVERITY_COLOR: Record<string, string> = {
  low:    Colors.success,
  medium: Colors.warning,
  high:   Colors.error,
};

export function ResultCard({ disease, confidence, severity }: ResultCardProps) {
  const pct = Math.round(confidence * 100);
  const color = SEVERITY_COLOR[severity] ?? Colors.textPrimary;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.disease}>{disease}</Text>
        <StatusBadge status={severity === 'high' ? 'critical' : severity === 'medium' ? 'warning' : 'normal'} label={severity} />
      </View>

      <Text style={styles.confidenceLabel}>Confidence</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.pctText, { color }]}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  disease: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.detection, flex: 1 },
  confidenceLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginBottom: 4 },
  barTrack: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  pctText: { marginTop: 4, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, textAlign: 'right' },
});
