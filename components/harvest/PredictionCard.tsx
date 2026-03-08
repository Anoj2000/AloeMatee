import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

interface PredictionCardProps {
  prediction: {
    optimalDate: string;
    daysRemaining: number;
    confidence: number;
    maturityScore: number;
    marketScore: number;
    recommendation: string;
  };
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const confidencePct = Math.round(prediction.confidence * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.optimalLabel}>Optimal Harvest Date</Text>
      <Text style={styles.optimalDate}>{prediction.optimalDate}</Text>
      <Text style={styles.daysRemaining}>
        {prediction.daysRemaining > 0
          ? `${prediction.daysRemaining} days from now`
          : 'Ready to harvest now!'}
      </Text>

      <View style={styles.scoreLine}>
        <Text style={styles.scoreItem}>🌱 Maturity: {Math.round(prediction.maturityScore * 100)}%</Text>
        <Text style={styles.scoreItem}>📊 Market: {Math.round(prediction.marketScore * 100)}%</Text>
        <Text style={styles.scoreItem}>🎯 Confidence: {confidencePct}%</Text>
      </View>

      <View style={styles.recBox}>
        <Text style={styles.recText}>{prediction.recommendation}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderTopWidth: 4,
    borderTopColor: Colors.harvest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  optimalLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  optimalDate: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.harvest,
    marginVertical: 4,
  },
  daysRemaining: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  scoreLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md, flexWrap: 'wrap', gap: 4 },
  scoreItem: { fontSize: Typography.sizes.sm, color: Colors.textPrimary, fontWeight: '500' },
  recBox: {
    backgroundColor: Colors.harvest + '15',
    borderRadius: 8,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.harvest,
  },
  recText: { fontSize: Typography.sizes.sm, color: Colors.textPrimary, lineHeight: 20 },
});
