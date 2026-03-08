/**
 * app/disease/upload.tsx
 * ──────────────────────
 * Receives three image URIs from camera-capture (uri1/uri2/uri3 params),
 * pre-fills the slots, then POSTs them to /api/v1/predict via multipart/form-data.
 * Slots can be tapped to swap an image from the gallery before submitting.
 */

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors, Spacing, Typography } from '@/constants';
import { predictDisease } from '@/services/apiClient';

// ── Step definitions ──────────────────────────────────────────────────────────

interface Step {
  key: string;
  label: string;
  progress: number;
}

const STEPS: Step[] = [
  { key: 'prepare',  label: 'Preparing images',        progress: 0.25 },
  { key: 'upload',   label: 'Uploading to server',      progress: 0.60 },
  { key: 'analyze',  label: 'Analyzing images with AI', progress: 0.90 },
  { key: 'complete', label: 'Analysis complete',        progress: 1.00 },
];

const SLOT_LABELS = ['Lesion close-up', 'Whole plant view', 'Base & soil'];

// ── Image slot ────────────────────────────────────────────────────────────────

interface SlotProps {
  index: number;
  uri: string | null;
  onPress: () => void;
  disabled: boolean;
}

function ImageSlot({ index, uri, onPress, disabled }: SlotProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.slot,
        uri && styles.slotFilled,
        pressed && !disabled && styles.slotPressed,
        disabled && styles.slotDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`Image ${index + 1}: ${SLOT_LABELS[index]}`}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.slotImage} resizeMode="cover" />
      ) : (
        <View style={styles.slotPlaceholder}>
          <Text style={styles.slotPlus}>+</Text>
          <Text style={styles.slotHint}>{SLOT_LABELS[index]}</Text>
        </View>
      )}
      <View style={styles.slotBadge}>
        <Text style={styles.slotBadgeText}>{index + 1}</Text>
      </View>
      {uri && (
        <View style={styles.slotTick}>
          <Text style={styles.slotTickText}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: Animated.Value }) {
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { width }]} />
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── Screen ────────────────────────────────────────────────────────────────────

type UploadPhase = 'idle' | 'uploading' | 'done' | 'error';

export default function DiseaseUploadScreen() {
  // Receive URIs from camera-capture (all three may arrive as params)
  const params = useLocalSearchParams<{ uri1?: string; uri2?: string; uri3?: string }>();

  const [uris, setUris] = useState<(string | null)[]>([
    params.uri1 ?? null,
    params.uri2 ?? null,
    params.uri3 ?? null,
  ]);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [currentStep, setCurrentStep] = useState(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const allSelected = uris.every(Boolean);

  // If all three arrived immediately from camera-capture, start automatically
  useEffect(() => {
    if (params.uri1 && params.uri2 && params.uri3) {
      handleAnalyze([params.uri1, params.uri2, params.uri3]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Gallery picker (fallback / swap) ──────────────────────────────────────

  async function pickImage(index: number) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Gallery permission is required to select images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      setUris((prev) => {
        const next = [...prev];
        next[index] = result.assets[0].uri;
        return next;
      });
      setErrorMsg(null);
    }
  }

  // ── Animated progress helper ──────────────────────────────────────────────

  function animateTo(value: number, duration = 600): Promise<void> {
    return new Promise((resolve) =>
      Animated.timing(progressAnim, { toValue: value, duration, useNativeDriver: false })
        .start(() => resolve()),
    );
  }

  // ── Main upload + analysis flow ───────────────────────────────────────────

  async function handleAnalyze(imageUris?: string[]) {
    const finalUris = imageUris ?? (uris as string[]);
    if (finalUris.some((u) => !u)) return;

    setPhase('uploading');
    setErrorMsg(null);
    progressAnim.setValue(0);

    try {
      // Step 0 — Preparing images
      setCurrentStep(0);
      await animateTo(STEPS[0].progress, 500);
      await delay(200);

      // Step 1 — Uploading (actual network call)
      setCurrentStep(1);

      // Build FormData manually so React Native XHR handles the boundary
      const form = new FormData();
      finalUris.forEach((uri, i) => {
        const fieldName = `image${i + 1}` as 'image1' | 'image2' | 'image3';
        const filename = uri.split('/').pop() ?? `${fieldName}.jpg`;
        const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
        form.append(fieldName, {
          uri,
          name: filename,
          type: ext === 'png' ? 'image/png' : 'image/jpeg',
        } as unknown as Blob);
      });

      await animateTo(STEPS[1].progress, 800);
      const predictionResult = await predictDisease(finalUris);

      // Step 2 — AI analysis
      setCurrentStep(2);
      await animateTo(STEPS[2].progress, 700);
      await delay(400);

      // Step 3 — Complete
      setCurrentStep(3);
      await animateTo(STEPS[3].progress, 400);
      await delay(500);

      setPhase('done');

      router.push({
        pathname: '/detection/result',
        params: { prediction: JSON.stringify(predictionResult) },
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Check that the backend is running on the same network.';
      setErrorMsg(msg);
      setPhase('error');
      setCurrentStep(-1);
      progressAnim.setValue(0);
    }
  }

  const isUploading = phase === 'uploading';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Review & Analyse</Text>
      <Text style={styles.sub}>
        Three images required. Tap any slot to swap it from your gallery.
      </Text>

      {/* Image slots */}
      <View style={styles.slots}>
        {uris.map((uri, i) => (
          <ImageSlot
            key={i}
            index={i}
            uri={uri}
            onPress={() => pickImage(i)}
            disabled={isUploading}
          />
        ))}
      </View>

      {/* Error banner */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {errorMsg}</Text>
          <Pressable onPress={() => setErrorMsg(null)}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </Pressable>
        </View>
      )}

      {/* Progress card */}
      {isUploading && (
        <View style={styles.progressCard}>
          <ProgressBar progress={progressAnim} />
          <View style={styles.stepList}>
            {STEPS.map((step, i) => {
              const done   = i < currentStep;
              const active = i === currentStep;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIndicator}>
                    {active ? (
                      <ActivityIndicator size="small" color={Colors.detection} />
                    ) : done ? (
                      <Text style={styles.stepDone}>✓</Text>
                    ) : (
                      <View style={styles.stepDot} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      active && styles.stepLabelActive,
                      done  && styles.stepLabelDone,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Analyse button (shown when not uploading) */}
      {!isUploading && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            !allSelected && styles.buttonDisabled,
            pressed && allSelected && styles.buttonPressed,
          ]}
          onPress={() => handleAnalyze()}
          disabled={!allSelected}
          accessibilityLabel="Analyse plant disease"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {allSelected
              ? 'Analyse Plant'
              : `Select ${uris.filter(Boolean).length} / 3 images`}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const SLOT_SIZE = 100;

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: 60 },

  heading: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sub: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  // ── Slots ──
  slots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  slotFilled: {
    borderStyle: 'solid',
    borderColor: Colors.detection,
  },
  slotPressed: { opacity: 0.75 },
  slotDisabled: { opacity: 0.5 },
  slotImage: { width: '100%', height: '100%' },
  slotPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  slotPlus: {
    fontSize: 28,
    color: Colors.textSecondary,
    lineHeight: 32,
    marginBottom: 2,
  },
  slotHint: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  slotBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.detection,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  slotTick: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTickText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // ── Error banner ──
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.error, lineHeight: 18 },
  errorDismiss: {
    marginLeft: Spacing.sm,
    fontSize: Typography.sizes.sm,
    color: Colors.detection,
    fontWeight: Typography.weights.semibold,
  },

  // ── Progress card ──
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  barFill: { height: '100%', backgroundColor: Colors.detection, borderRadius: 3 },
  stepList: { gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepIndicator: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  stepDone: { fontSize: 14, color: Colors.success, fontWeight: '700' },
  stepLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  stepLabelActive: { color: Colors.detection, fontWeight: Typography.weights.semibold },
  stepLabelDone: { color: Colors.success },

  // ── Analyse button ──
  button: {
    backgroundColor: Colors.detection,
    borderRadius: 14,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: Colors.border },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: '#fff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
