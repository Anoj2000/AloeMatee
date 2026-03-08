import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants';
import type { PredictResponse, PredictionItem } from '@/services/apiClient';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CONF_COLOR: Record<string, string> = {
  HIGH:   Colors.success,
  MEDIUM: Colors.warning,
  LOW:    Colors.error,
};

const CONF_LABEL: Record<string, string> = {
  HIGH:   'High Confidence',
  MEDIUM: 'Medium Confidence',
  LOW:    'Low Confidence',
};

// â”€â”€ Animated confidence bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ConfBar({ prob, color }: { prob: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: prob, duration: 700, useNativeDriver: false }).start();
  }, [prob]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={barS.track}>
      <Animated.View style={[barS.fill, { width, backgroundColor: color }]} />
    </View>
  );
}
const barS = StyleSheet.create({
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.border, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 4 },
});

// â”€â”€ Prediction row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PredRow({ item, color, isTop }: { item: PredictionItem; color: string; isTop: boolean }) {
  return (
    <View style={rowS.wrap}>
      <View style={rowS.header}>
        <Text style={[rowS.name, isTop && rowS.nameTop]}>{item.disease_name}</Text>
        <Text style={[rowS.pct, { color }]}>{Math.round(item.prob * 100)}%</Text>
      </View>
      <ConfBar prob={item.prob} color={color} />
    </View>
  );
}
const rowS = StyleSheet.create({
  wrap:    { marginBottom: Spacing.md },
  header:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name:    { fontSize: Typography.sizes.md, color: Colors.textSecondary, flex: 1 },
  nameTop: { color: Colors.textPrimary, fontWeight: Typography.weights.semibold },
  pct:     { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, marginLeft: Spacing.sm },
});

// â”€â”€ Main screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DetectionResultScreen() {
  const { prediction } = useLocalSearchParams<{ prediction?: string }>();

  if (!prediction) {
    return (
      <View style={s.centered}>
        <Text style={s.emptyIcon}>ðŸ”¬</Text>
        <Text style={s.emptyTitle}>No Result</Text>
        <Text style={s.emptyHint}>Run an analysis from the Upload screen to see results here.</Text>
        <Pressable style={s.btn} onPress={() => router.replace('/detection/upload')}>
          <Text style={s.btnText}>Go to Upload</Text>
        </Pressable>
      </View>
    );
  }

  const result: PredictResponse = JSON.parse(prediction);
  const top     = result.predictions[0] ?? null;
  const isLow   = result.confidence_status === 'LOW';
  const clr     = CONF_COLOR[result.confidence_status] ?? Colors.textSecondary;

  function goTreatment(mode: 'SCIENTIFIC' | 'AYURVEDIC') {
    if (!top) return;
    router.push({
      pathname: '/detection/treatment',
      params: { diseaseId: String(top.disease_id), diseaseName: top.disease_name, mode },
    });
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>

      {/* â”€â”€ Confidence badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={[s.badge, { backgroundColor: clr + '18', borderColor: clr }]}>
        <View style={[s.badgeDot, { backgroundColor: clr }]} />
        <Text style={[s.badgeText, { color: clr }]}>
          {CONF_LABEL[result.confidence_status] ?? result.confidence_status}
        </Text>
      </View>

      {/* â”€â”€ Disease name card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Detected Disease</Text>
        {top ? (
          <>
            <Text style={s.diseaseName}>{top.disease_name}</Text>
            <Text style={[s.topProb, { color: clr }]}>{Math.round(top.prob * 100)}% probability</Text>
          </>
        ) : (
          <Text style={s.diseaseName}>Plant appears healthy ðŸŒ±</Text>
        )}
      </View>

      {/* â”€â”€ Symptoms summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Symptoms Summary</Text>
        <Text style={s.bodyText}>{result.symptoms_summary}</Text>
      </View>

      {/* â•â•â•â•â•â•â•â•â•â•â•â• LOW CONFIDENCE branch â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {isLow && (
        <>
          <View style={[s.card, s.lowCard]}>
            <Text style={s.lowTitle}>âš   Low Confidence Detection</Text>
            <Text style={s.bodyText}>
              The model could not analyse the images with sufficient confidence. This is often caused
              by poor lighting, motion blur, or an unusual plant angle.
            </Text>
          </View>

          {result.retake_message && (
            <View style={s.card}>
              <Text style={s.cardLabel}>ðŸ“·  Tips for Better Photos</Text>
              {result.retake_message
                .split(/[;(\d+)]/) // split on semicolons or numbered items
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tip, i) => (
                  <View key={i} style={s.tipRow}>
                    <Text style={s.tipBullet}>â€¢</Text>
                    <Text style={s.tipText}>{tip}</Text>
                  </View>
                ))}
            </View>
          )}

          <View style={s.actions}>
            <Pressable
              style={({ pressed }) => [s.btn, s.btnWarning, pressed && s.btnPressed]}
              onPress={() => router.replace('/detection/upload')}
            >
              <Text style={s.btnText}>ðŸ“·  Retake Photos</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â• MEDIUM / HIGH CONFIDENCE branch â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {!isLow && (
        <>
          {/* Predictions with animated bars */}
          {result.predictions.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardLabel}>Prediction Breakdown</Text>
              {result.predictions.map((p, i) => (
                <PredRow
                  key={p.disease_id}
                  item={p}
                  color={i === 0 ? clr : Colors.border}
                  isTop={i === 0}
                />
              ))}
            </View>
          )}

          {/* Treatment buttons */}
          {top && (
            <View style={s.actions}>
              <Pressable
                style={({ pressed }) => [s.btn, pressed && s.btnPressed]}
                onPress={() => goTreatment('SCIENTIFIC')}
              >
                <Text style={s.btnText}>ðŸ”¬  Scientific Treatment</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.btn, s.btnAyurvedic, pressed && s.btnPressed]}
                onPress={() => goTreatment('AYURVEDIC')}
              >
                <Text style={s.btnText}>ðŸŒ¿  Ayurvedic Treatment</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.btn, s.btnOutline, pressed && s.btnPressed]}
                onPress={() => router.replace('/detection/upload')}
              >
                <Text style={[s.btnText, s.btnTextOutline]}>New Analysis</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const s = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: Colors.background },
  container:  { padding: Spacing.lg, paddingBottom: Spacing.xxl, alignItems: 'center' },

  // Empty state
  centered:   { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  emptyIcon:  { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  emptyHint:  { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 280, marginBottom: Spacing.xl },

  // Confidence badge
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingVertical: 5, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  badgeDot:  { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  // Cards
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lowCard:   { borderLeftWidth: 4, borderLeftColor: Colors.error },
  cardLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: Typography.weights.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },

  // Disease name
  diseaseName: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  topProb:     { fontSize: Typography.sizes.sm, marginTop: 4 },

  // Body text
  bodyText: { fontSize: Typography.sizes.md, color: Colors.textPrimary, lineHeight: 22 },

  // Low confidence
  lowTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.error, marginBottom: Spacing.sm },
  tipRow:   { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, alignItems: 'flex-start' },
  tipBullet:{ fontSize: Typography.sizes.md, color: Colors.detection, fontWeight: Typography.weights.bold, marginTop: 1 },
  tipText:  { flex: 1, fontSize: Typography.sizes.md, color: Colors.textPrimary, lineHeight: 21 },

  // Action buttons
  actions:        { width: '100%', gap: Spacing.sm, marginTop: Spacing.sm },
  btn:            { backgroundColor: Colors.detection, borderRadius: 14, paddingVertical: Spacing.md, alignItems: 'center' },
  btnAyurvedic:   { backgroundColor: Colors.primary },
  btnWarning:     { backgroundColor: Colors.warning },
  btnOutline:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.detection },
  btnPressed:     { opacity: 0.82 },
  btnText:        { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: '#fff' },
  btnTextOutline: { color: Colors.detection },
});
