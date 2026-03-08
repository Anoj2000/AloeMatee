import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

interface TreatmentStepProps {
  step: number;
  title: string;
  description: string;
}

export function TreatmentStep({ step, title, description }: TreatmentStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNumber}>{step}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-start' },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.detection,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
    flexShrink: 0,
  },
  stepNumber: { color: '#fff', fontWeight: Typography.weights.bold, fontSize: Typography.sizes.sm },
  content: { flex: 1 },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  description: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },
});
