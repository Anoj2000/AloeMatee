import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

type Priority = 'high' | 'medium' | 'low';

interface ReminderCardProps {
  title: string;
  due: string;
  priority: Priority;
}

const PRIORITY_COLOR: Record<Priority, string> = {
  high:   Colors.error,
  medium: Colors.warning,
  low:    Colors.success,
};

export function ReminderCard({ title, due, priority }: ReminderCardProps) {
  const color = PRIORITY_COLOR[priority];
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={[styles.badgeText, { color }]}>{priority}</Text>
        </View>
      </View>
      <Text style={styles.due}>🕐 {due}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, flex: 1 },
  badge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: Typography.sizes.xs, fontWeight: '600', textTransform: 'capitalize' },
  due: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
});
