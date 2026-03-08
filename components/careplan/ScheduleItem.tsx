import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

interface ScheduleItemProps {
  title: string;
  description: string;
  time: string;
  completed: boolean;
  category: string;
}

export function ScheduleItem({ title, description, time, completed, category }: ScheduleItemProps) {
  return (
    <View style={[styles.item, completed && styles.completedItem]}>
      <View style={[styles.checkbox, completed && styles.checkedBox]}>
        {completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.title, completed && styles.strikeThrough]}>{title}</Text>
          <Text style={styles.category}>{category}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.careplan,
  },
  completedItem: { borderLeftColor: Colors.success, opacity: 0.7 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.careplan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
    flexShrink: 0,
  },
  checkedBox: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  title: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, flex: 1 },
  strikeThrough: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  category: {
    fontSize: Typography.sizes.xs,
    color: Colors.careplan,
    backgroundColor: Colors.careplan + '18',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  description: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginBottom: 4 },
  time: { fontSize: Typography.sizes.xs, color: Colors.primary, fontWeight: '500' },
});
