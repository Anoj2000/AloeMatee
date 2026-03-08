import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants';

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Lesion close-up',  hint: 'Hold the camera close to the affected leaf area.' },
  { label: 'Whole plant view', hint: 'Step back to frame the entire plant.' },
  { label: 'Base & soil',      hint: 'Point downward to capture the base and soil.' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'capture' | 'preview';

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CameraCaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [stepIndex, setStepIndex] = useState(0);
  const [capturedUris, setCapturedUris] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('capture');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  // ── Permission gate ───────────────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.detection} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permHint}>
          This screen needs the camera to capture plant images for disease analysis.
        </Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  // ── Capture ───────────────────────────────────────────────────────────────

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setPreviewUri(photo.uri);
        setPhase('preview');
      }
    } finally {
      setCapturing(false);
    }
  }

  // ── Accept captured photo ─────────────────────────────────────────────────

  function handleAccept() {
    if (!previewUri) return;

    const updatedUris = [...capturedUris, previewUri];

    if (updatedUris.length === STEPS.length) {
      // All 3 captured — navigate to upload screen
      router.push({
        pathname: '/disease/upload',
        params: {
          uri1: updatedUris[0],
          uri2: updatedUris[1],
          uri3: updatedUris[2],
        },
      });
      return;
    }

    setCapturedUris(updatedUris);
    setStepIndex(updatedUris.length);
    setPreviewUri(null);
    setPhase('capture');
  }

  // ── Retake ────────────────────────────────────────────────────────────────

  function handleRetake() {
    setPreviewUri(null);
    setPhase('capture');
  }

  // ── Progress indicator ────────────────────────────────────────────────────

  const step = STEPS[stepIndex];
  const progressLabel = `${stepIndex + 1} / ${STEPS.length}`;

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'preview' && previewUri) {
    return (
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.progressRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < stepIndex && styles.dotDone,
                i === stepIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Text style={styles.stepCounter}>{progressLabel}</Text>
        <Text style={styles.stepLabel}>{step.label}</Text>
        <Text style={styles.stepHint}>Use this photo or retake it.</Text>

        <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />

        <View style={styles.previewActions}>
          <Pressable
            style={({ pressed }) => [styles.retakeBtn, pressed && styles.btnPressed]}
            onPress={handleRetake}
          >
            <Text style={styles.retakeBtnText}>↺  Retake</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.acceptBtn, pressed && styles.btnPressed]}
            onPress={handleAccept}
          >
            <Text style={styles.acceptBtnText}>
              {stepIndex + 1 === STEPS.length ? '✓  Finish' : '→  Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Camera viewfinder ─────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < stepIndex && styles.dotDone,
              i === stepIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <Text style={styles.stepCounter}>{progressLabel}</Text>
      <Text style={styles.stepLabel}>{step.label}</Text>
      <Text style={styles.stepHint}>{step.hint}</Text>

      {/* Camera */}
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Corner guides */}
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
      </CameraView>

      {/* Shutter button */}
      <Pressable
        style={({ pressed }) => [
          styles.shutter,
          pressed && styles.shutterPressed,
          capturing && styles.shutterDisabled,
        ]}
        onPress={handleCapture}
        disabled={capturing}
        accessibilityLabel="Take photo"
        accessibilityRole="button"
      >
        {capturing
          ? <ActivityIndicator color="#fff" />
          : <View style={styles.shutterInner} />
        }
      </Pressable>

      {/* Thumbnail strip of already-captured images */}
      {capturedUris.length > 0 && (
        <View style={styles.thumbRow}>
          {capturedUris.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.thumb} resizeMode="cover" />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CORNER = 22;
const BORDER = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: Spacing.md,
  },
  center: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },

  // ── Progress ──
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#444',
  },
  dotDone: {
    backgroundColor: Colors.success,
  },
  dotActive: {
    backgroundColor: Colors.detection,
    width: 24,
    borderRadius: 5,
  },

  // ── Step text ──
  stepCounter: {
    fontSize: Typography.sizes.sm,
    color: '#aaa',
    fontWeight: Typography.weights.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stepLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: '#fff',
    marginTop: 2,
    marginBottom: 2,
  },
  stepHint: {
    fontSize: Typography.sizes.sm,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 260,
  },

  // ── Camera ──
  camera: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cornerTL: { position: 'absolute', top: 12, left: 12, width: CORNER, height: CORNER, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderColor: '#fff', borderRadius: 2 },
  cornerTR: { position: 'absolute', top: 12, right: 12, width: CORNER, height: CORNER, borderTopWidth: BORDER, borderRightWidth: BORDER, borderColor: '#fff', borderRadius: 2 },
  cornerBL: { position: 'absolute', bottom: 12, left: 12, width: CORNER, height: CORNER, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderColor: '#fff', borderRadius: 2 },
  cornerBR: { position: 'absolute', bottom: 12, right: 12, width: CORNER, height: CORNER, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderColor: '#fff', borderRadius: 2 },

  // ── Shutter ──
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  shutterPressed: { opacity: 0.7 },
  shutterDisabled: { opacity: 0.4 },

  // ── Thumbnail strip ──
  thumbRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.success,
  },

  // ── Preview ──
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    marginBottom: 20,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 16,
  },
  retakeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#666',
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  retakeBtnText: {
    color: '#ccc',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: Colors.detection,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  btnPressed: { opacity: 0.8 },

  // ── Permission gate ──
  permTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  permHint: {
    fontSize: Typography.sizes.sm,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    maxWidth: 280,
  },
  permBtn: {
    backgroundColor: Colors.detection,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  permBtnText: {
    color: '#fff',
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.md,
  },
});
