import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';
import { StatusBadge } from '@/components/common/StatusBadge';

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export function SensorCard({ label, value, unit, status }: SensorCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <StatusBadge status={status} />
      </View>
      <Text style={styles.value}>
        {value}
        <Text style={styles.unit}> {unit}</Text>
      </Text>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  label: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  value: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.monitoring },
  unit: { fontSize: Typography.sizes.md, fontWeight: '400', color: Colors.textSecondary },
});
