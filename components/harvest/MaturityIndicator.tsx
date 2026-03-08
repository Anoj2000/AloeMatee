import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

interface MaturityData {
  stage: 'seedling' | 'juvenile' | 'mature' | 'over-mature';
  score: number;
  readyToHarvest: boolean;
}

const STAGE_ORDER = ['seedling', 'juvenile', 'mature', 'over-mature'];

export function MaturityIndicator({ data }: { data: MaturityData }) {
  const stageIndex = STAGE_ORDER.indexOf(data.stage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Maturity Stage</Text>
        <Text style={[styles.readyBadge, { backgroundColor: data.readyToHarvest ? Colors.success + '22' : Colors.warning + '22', color: data.readyToHarvest ? Colors.success : Colors.warning }]}>
          {data.readyToHarvest ? '✓ Ready' : '⏳ Not Ready'}
        </Text>
      </View>

      <View style={styles.stageTrack}>
        {STAGE_ORDER.map((stage, index) => (
          <View key={stage} style={styles.stageItem}>
            <View
              style={[
                styles.stageDot,
                index <= stageIndex && { backgroundColor: Colors.harvest },
              ]}
            />
            {index < STAGE_ORDER.length - 1 && (
              <View style={[styles.stageLine, index < stageIndex && { backgroundColor: Colors.harvest }]} />
            )}
            <Text style={[styles.stageLabel, data.stage === stage && styles.activeStagelabel]}>
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>Maturity Score</Text>
        <Text style={styles.scoreValue}>{Math.round(data.score * 100)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${data.score * 100}%` as any }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  title: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  readyBadge: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  stageTrack: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  stageItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stageDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border, marginBottom: 4 },
  stageLine: {
    position: 'absolute',
    top: 5,
    right: -'50%' as any,
    width: '100%',
    height: 2,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
  stageLabel: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center' },
  activeStagelabel: { color: Colors.harvest, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  scoreLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  scoreValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.harvest },
  track: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.harvest, borderRadius: 4 },
});
