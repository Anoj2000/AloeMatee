import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  accentColor?: string;
}

export function Header({ title, showBack = false, accentColor }: HeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {showBack && (
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, accentColor ? { color: accentColor } : null]}>← Back</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.title, accentColor ? { color: accentColor } : null]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { marginBottom: 4 },
  backText: { fontSize: Typography.sizes.sm, color: Colors.primary },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
});
