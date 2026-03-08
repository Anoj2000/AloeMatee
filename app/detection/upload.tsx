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
import { router } from 'expo-router';

import { Colors, Spacing, Typography } from '@/constants';
import { predictDisease } from '@/services/apiClient';

// ── Progress step definitions ─────────────────────────────────────────────────

interface Step {
  key: string;
  label: string;
  progress: number; // target bar progress 0–1 when this step completes
}

const STEPS: Step[] = [
  { key: 'prepare',  label: 'Preparing images',        progress: 0.25 },
  { key: 'upload',   label: 'Uploading to server',      progress: 0.60 },
  { key: 'analyze',  label: 'Analyzing images with AI', progress: 0.90 },
  { key: 'complete', label: 'Analysis complete',        progress: 1.00 },
];

// ── Image slot component ───────────────────────────────────────────────────────

const SLOT_LABELS = ['Lesion close-up', 'Whole plant view', 'Base & soil'];

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
      accessibilityLabel={`Pick image ${index + 1}: ${SLOT_LABELS[index]}`}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.slotImage} resizeMode="cover" />
      ) : (
        <View style={styles.slotPlaceholder}>
          <Text style={styles.slotPlus}>+</Text>
          <Text style={styles.slotLabel}>{SLOT_LABELS[index]}</Text>
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

// ── Progress bar component ────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: Animated.Value }) {
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { width }]} />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

type UploadPhase = 'idle' | 'uploading' | 'done' | 'error';

export default function UploadScreen() {
  const [uris, setUris] = useState<(string | null)[]>([null, null, null]);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const allSelected = uris.every(Boolean);

  // ── Pick a single image ───────────────────────────────────────────────────
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

  // ── Animate progress bar to a target value ────────────────────────────────
  function animateTo(value: number, duration = 600): Promise<void> {
    return new Promise((resolve) =>
      Animated.timing(progressAnim, {
        toValue: value,
        duration,
        useNativeDriver: false,
      }).start(() => resolve()),
    );
  }

  // ── Run upload + analysis flow ────────────────────────────────────────────
  async function handleAnalyze() {
    if (!allSelected) return;
    setPhase('uploading');
    setErrorMsg(null);
    progressAnim.setValue(0);

    try {
      // Step 0: Preparing images
      setCurrentStep(0);
      await animateTo(STEPS[0].progress, 500);
      await delay(300);

      // Step 1: Uploading to server  (real network call starts here)
      setCurrentStep(1);
      await animateTo(STEPS[1].progress, 800);

      const predictionResult = await predictDisease(uris as string[]);

      // Step 2: Analyzing images with AI
      setCurrentStep(2);
      await animateTo(STEPS[2].progress, 700);
      await delay(400);

      // Step 3: Analysis complete
      setCurrentStep(3);
      await animateTo(STEPS[3].progress, 400);
      await delay(600);

      setPhase('done');

      // Navigate to result, passing serialised prediction
      router.push({
        pathname: '/detection/result',
        params: { prediction: JSON.stringify(predictionResult) },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'An unexpected error occurred. Check that the backend is reachable.';
      setErrorMsg(msg);
      setPhase('error');
      setCurrentStep(-1);
      progressAnim.setValue(0);
    }
  }

  const isUploading = phase === 'uploading';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <Text style={styles.heading}>Upload Three Images</Text>
      <Text style={styles.sub}>
        Select a close-up of the affected area, a full-plant photo, and a base/soil shot.
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

      {/* Error message */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {errorMsg}</Text>
          <Pressable onPress={() => setErrorMsg(null)}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </Pressable>
        </View>
      )}

      {/* Progress section */}
      {isUploading && (
        <View style={styles.progressCard}>
          <ProgressBar progress={progressAnim} />

          <View style={styles.stepList}>
            {STEPS.map((step, i) => {
              const done = i < currentStep;
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
                      done && styles.stepLabelDone,
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

      {/* Analyse button */}
      {!isUploading && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            !allSelected && styles.buttonDisabled,
            pressed && allSelected && styles.buttonPressed,
          ]}
          onPress={handleAnalyze}
          disabled={!allSelected}
          accessibilityLabel="Analyse plant disease"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {allSelected ? 'Analyse Plant' : `Select ${uris.filter(Boolean).length}/3 images`}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const SLOT_SIZE = 100;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },

  // Header
  heading: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  sub: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: Spacing.lg,
  },

  // Image slots
  slots: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  slotPressed: {
    opacity: 0.75,
  },
  slotDisabled: {
    opacity: 0.5,
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  slotPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  slotPlus: {
    fontSize: 28,
    color: Colors.textSecondary,
    lineHeight: 30,
  },
  slotLabel: {
    fontSize: Typography.sizes.xs,
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
  slotBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#fff',
  },
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
  slotTickText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: Typography.weights.bold,
  },

  // Error
  errorBox: {
    width: '100%',
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    lineHeight: 18,
  },
  errorDismiss: {
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    fontWeight: Typography.weights.semibold,
    marginLeft: Spacing.sm,
  },

  // Progress card
  progressCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // Progress bar
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.detection,
  },

  // Steps
  stepList: {
    gap: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDone: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: Typography.weights.bold,
  },
  stepLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  stepLabelActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  stepLabelDone: {
    color: Colors.success,
  },

  // Analyse button
  button: {
    width: '100%',
    backgroundColor: Colors.detection,
    borderRadius: 14,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#fff',
  },
});
