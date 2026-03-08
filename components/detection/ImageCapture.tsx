import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography } from '@/constants';

interface ImageCaptureProps {
  image: string | null;
  onImageSelected: (uri: string) => void;
}

export function ImageCapture({ image, onImageSelected }: ImageCaptureProps) {
  const requestAndPick = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera access is needed to take photos.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Photo library access is needed to select images.');
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

    if (!result.canceled && result.assets.length > 0) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      {image ? (
        <View style={styles.preview}>
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          <TouchableOpacity style={styles.retakeButton} onPress={() => onImageSelected('')}>
            <Text style={styles.retakeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🌿</Text>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => requestAndPick(true)}>
          <Text style={styles.buttonText}>📷  Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => requestAndPick(false)}>
          <Text style={styles.buttonText}>🖼️  Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  preview: { position: 'relative', marginBottom: Spacing.sm },
  image: { width: '100%', height: 260, borderRadius: 12 },
  retakeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retakeText: { color: '#fff', fontSize: Typography.sizes.xs },
  placeholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  placeholderIcon: { fontSize: 40 },
  placeholderText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  buttonRow: { flexDirection: 'row', gap: Spacing.sm },
  button: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.detection,
  },
  buttonText: { fontSize: Typography.sizes.sm, color: Colors.detection, fontWeight: '500' },
});
