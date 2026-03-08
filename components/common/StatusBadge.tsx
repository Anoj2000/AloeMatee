import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '@/constants';

type StatusType = 'normal' | 'warning' | 'critical' | 'success';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const STATUS_CONFIG: Record<StatusType, { bg: string; text: string; defaultLabel: string }> = {
  normal:   { bg: Colors.success + '22', text: Colors.success,  defaultLabel: 'Normal' },
  success:  { bg: Colors.success + '22', text: Colors.success,  defaultLabel: 'Success' },
  warning:  { bg: Colors.warning + '22', text: Colors.warning,  defaultLabel: 'Warning' },
  critical: { bg: Colors.error   + '22', text: Colors.error,    defaultLabel: 'Critical' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.text }]}>
      <Text style={[styles.text, { color: config.text }]}>
        {label ?? config.defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
