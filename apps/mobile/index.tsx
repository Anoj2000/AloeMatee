import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <Text style={styles.iconEmoji}>🌿</Text>
        </View>

        <Text style={styles.title}>Aloe Maturity</Text>
        <Text style={styles.subtitle}>AI-Powered Plant Scanner</Text>

        <View style={styles.descCard}>
          <Text style={styles.descItem}>🔍  Close-up CNN texture analysis</Text>
          <Text style={styles.descItem}>📐  Geometric size measurement</Text>
          <Text style={styles.descItem}>🧠  Ensemble prediction engine</Text>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/camera')}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>Start Scan</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Point your camera at an aloe plant{'\n'}to assess its maturity level
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#111',
  },
  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1a2e1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  iconEmoji: { fontSize: 56 },
  title: { color: '#4CAF50', fontSize: 34, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  subtitle: { color: '#888', fontSize: 15, marginBottom: 36 },
  descCard: {
    backgroundColor: '#1b1b1b',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 36,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  descItem: { color: '#ccc', fontSize: 14, lineHeight: 22 },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 14,
    marginBottom: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  footer: { color: '#555', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});