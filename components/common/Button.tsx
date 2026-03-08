import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', color, disabled, style }: ButtonProps) {
  const resolvedColor = color ?? Colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === 'primary' && { backgroundColor: resolvedColor },
        variant === 'outline' && { borderWidth: 1.5, borderColor: resolvedColor },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && { color: '#fff' },
          variant === 'outline' && { color: resolvedColor },
          variant === 'ghost' && { color: resolvedColor },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  disabled: { opacity: 0.4 },
});
