import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

export default function ChatbotScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>??</Text>
      <Text style={styles.title}>AloeMate Assistant</Text>
      <Text style={styles.hint}>
        Ask your AI-powered farming assistant anything about Aloe Vera care, disease treatment, and harvesting.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  icon: { fontSize: 56, marginBottom: Spacing.md },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  hint: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});