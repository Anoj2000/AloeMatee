import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants';
import { getTreatment, type TreatmentMode, type TreatmentResult } from '@/services/apiClient';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Split a prose paragraph into discrete numbered steps.
 * Sentences that start with a capital letter after a full stop are treated as
 * separate steps; numbered lists ("1. …") are also detected.
 */
function parseSteps(text: string): string[] {
  // Try numbered list first: "1. Foo. 2. Bar."
  const numbered = text.match(/\d+\.\s+[^.]+(?:\.[^.]+)*/g);
  if (numbered && numbered.length > 1) {
    return numbered.map((s) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
  }
  // Fall back: split on ". " followed by a capital letter
  return text
    .split(/\.\s+(?=[A-Z])/)
    .map((s) => s.replace(/\.$/, '').trim())
    .filter(Boolean);
}

/** Split a dosage/warnings string into bullet items on ; or numbered markers. */
function parseBullets(text: string): string[] {
  const bySemicolon = text.split(/;\s*/).map((s) => s.trim()).filter(Boolean);
  if (bySemicolon.length > 1) return bySemicolon;
  return text
    .split(/\.\s+(?=[A-Z])/)
    .map((s) => s.replace(/\.$/, '').trim())
    .filter(Boolean);
}

export default function TreatmentScreen() {
  const { diseaseId, diseaseName, mode } =
    useLocalSearchParams<{ diseaseId?: string; diseaseName?: string; mode?: string }>();

  const treatmentMode: TreatmentMode =
    mode === 'AYURVEDIC' ? 'AYURVEDIC' : 'SCIENTIFIC';

  const [data, setData]       = useState<TreatmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<TreatmentMode>(treatmentMode);

  useEffect(() => {
    if (!diseaseId) {
      setError('No disease ID provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getTreatment(diseaseId, activeMode)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [diseaseId, activeMode]);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Text style={s.heading}>{diseaseName ?? 'Treatment Guide'}</Text>

      {/* ── Mode toggle ─────────────────────────────────────────────────── */}
      <View style={s.toggle}>
        {(['SCIENTIFIC', 'AYURVEDIC'] as TreatmentMode[]).map((m) => (
          <Pressable
            key={m}
            style={[s.toggleBtn, activeMode === m && s.toggleBtnActive]}
            onPress={() => setActiveMode(m)}
          >
            <Text style={[s.toggleText, activeMode === m && s.toggleTextActive]}>
              {m === 'SCIENTIFIC' ? '🔬  Scientific' : '🌿  Ayurvedic'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={Colors.detection} />
          <Text style={s.loadingText}>Loading treatment data…</Text>
        </View>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {!loading && error && (
        <View style={s.errorCard}>
          <Text style={s.errorTitle}>⚠  Could not load treatment</Text>
          <Text style={s.errorMsg}>{error}</Text>
          <Pressable
            style={({ pressed }) => [s.btn, pressed && s.btnPressed]}
            onPress={() => { setError(null); setLoading(true); }}
          >
            <Text style={s.btnText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {!loading && data && (
        <>
          {/* ── Treatment steps ─────────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.cardLabel}>
              {activeMode === 'SCIENTIFIC' ? '🔬  Scientific Treatment' : '🌿  Ayurvedic Treatment'}
            </Text>
            {parseSteps(data.treatment).map((step, i) => (
              <View key={i} style={s.stepRow}>
                <View style={s.stepNumWrap}>
                  <Text style={s.stepNum}>{i + 1}</Text>
                </View>
                <Text style={s.stepText}>{step}.</Text>
              </View>
            ))}
          </View>

          {/* ── Dosage ──────────────────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.cardLabel}>💊  Dosage &amp; Application</Text>
            {parseBullets(data.dosage).map((item, i) => (
              <View key={i} style={s.bulletRow}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.bulletText}>{item}.</Text>
              </View>
            ))}
          </View>

          {/* ── Safety warnings ─────────────────────────────────────────── */}
          <View style={[s.card, s.warnCard]}>
            <Text style={s.cardLabel}>⚠  Safety Warnings</Text>
            {parseBullets(data.warnings).map((item, i) => (
              <View key={i} style={s.bulletRow}>
                <Text style={[s.bulletDot, s.bulletDotWarn]}>⚠</Text>
                <Text style={s.bulletText}>{item}.</Text>
              </View>
            ))}
          </View>

          {/* ── Sources ─────────────────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.cardLabel}>📚  Sources</Text>
            {data.sources.map((src, i) => (
              <View key={i} style={s.sourceRow}>
                <Text style={s.sourceBullet}>{i + 1}.</Text>
                <Text style={s.sourceText}>{src}</Text>
              </View>
            ))}
          </View>

          {/* ── Disclaimer ──────────────────────────────────────────────── */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerIcon}>ℹ</Text>
            <Text style={s.disclaimerText}>
              This information is for educational purposes only. Always consult a qualified
              agronomist or plant pathologist before applying any treatment to your plants.
            </Text>
          </View>

          {/* ── Back button ─────────────────────────────────────────────── */}
          <View style={s.actions}>
            <Pressable
              style={({ pressed }) => [s.btn, s.btnOutline, pressed && s.btnPressed]}
              onPress={() => router.back()}
            >
              <Text style={[s.btnText, s.btnTextOutline]}>← Back to Results</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: Colors.background },
  container:  { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  heading: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },

  // Mode toggle
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  toggleText:       { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  toggleTextActive: { color: Colors.textPrimary, fontWeight: Typography.weights.semibold },

  // Loading
  centered:    { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  loadingText: { fontSize: Typography.sizes.md, color: Colors.textSecondary },

  // Error
  errorCard:  { backgroundColor: '#FFEBEE', borderRadius: 14, padding: Spacing.lg, borderLeftWidth: 4, borderLeftColor: Colors.error, marginBottom: Spacing.md, gap: Spacing.sm },
  errorTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.error },
  errorMsg:   { fontSize: Typography.sizes.md, color: Colors.error, lineHeight: 20 },

  // Cards
  card: {
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
  warnCard:  { borderLeftWidth: 4, borderLeftColor: Colors.warning },
  cardLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: Typography.weights.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  bodyText:  { fontSize: Typography.sizes.md, color: Colors.textPrimary, lineHeight: 23 },

  // Treatment steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepNumWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.detection + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepNum: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.detection,
  },
  stepText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    lineHeight: 23,
  },

  // Dosage / warning bullets
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bulletDot: {
    fontSize: Typography.sizes.lg,
    color: Colors.primary,
    lineHeight: 23,
    marginTop: 1,
  },
  bulletDotWarn: { color: Colors.warning, fontSize: Typography.sizes.sm },
  bulletText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    lineHeight: 23,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: Colors.info + '12',
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  disclaimerIcon: {
    fontSize: Typography.sizes.md,
    color: Colors.info,
    fontWeight: Typography.weights.bold,
    marginTop: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.info,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Sources
  sourceRow:    { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, alignItems: 'flex-start' },
  sourceBullet: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, minWidth: 18 },
  sourceText:   { flex: 1, fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 19 },

  // Buttons
  actions:        { gap: Spacing.sm, marginTop: Spacing.sm },
  btn:            { backgroundColor: Colors.detection, borderRadius: 14, paddingVertical: Spacing.md, alignItems: 'center' },
  btnOutline:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.detection },
  btnPressed:     { opacity: 0.82 },
  btnText:        { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold, color: '#fff' },
  btnTextOutline: { color: Colors.detection },
});