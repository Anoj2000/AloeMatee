import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants';
import { Card } from '@/components/common/Card';

// ─── Types ───────────────────────────────────────────────────────────────────

type ModuleItem = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  accentColor: string;
  bgColor: string;
  route: string;
};

type Tip = {
  icon: string;
  text: string;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const MODULES: ModuleItem[] = [
  {
    id: 'detection',
    icon: '🔬',
    title: 'Disease Detection & Treatment',
    subtitle: 'Scan leaves for diseases and receive treatment guidance instantly',
    accentColor: Colors.detection,
    bgColor: '#FFEBEE',
    route: '/detection/upload',
  },
  {
    id: 'monitoring',
    icon: '📡',
    title: 'IoT Monitoring',
    subtitle: 'Live sensor data, disease risk alerts, and environmental trends',
    accentColor: Colors.monitoring,
    bgColor: '#E3F2FD',
    route: '/monitoring',
  },
  {
    id: 'careplan',
    icon: '💬',
    title: 'Care Plan + Chatbot',
    subtitle: 'AI-powered assistant, treatment schedule, and reminders',
    accentColor: Colors.careplan,
    bgColor: '#F3E5F5',
    route: '/careplan',
  },
  {
    id: 'harvest',
    icon: '📊',
    title: 'Harvest Prediction',
    subtitle: 'Optimal harvest timing based on maturity and market trends',
    accentColor: Colors.harvest,
    bgColor: '#FFF3E0',
    route: '/harvest',
  },
];

const TIPS: Tip[] = [
  {
    icon: '💧',
    text: 'Water deeply but infrequently — every 2–3 weeks in summer.',
  },
  {
    icon: '🪴',
    text: 'Use well-draining soil to prevent root rot.',
  },
  {
    icon: '☀️',
    text: 'Aloe thrives in indirect bright light; avoid harsh midday sun.',
  },
  {
    icon: '🟡',
    text: 'Yellow leaves often indicate overwatering — check soil moisture first.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModuleCard({ mod, onPress }: { mod: ModuleItem; onPress: () => void }) {
  return (
    <Card
      onPress={onPress}
      style={[styles.moduleCard, { borderLeftColor: mod.accentColor }]}
    >
      <View style={[styles.iconBubble, { backgroundColor: mod.bgColor }]}>
        <Text style={styles.moduleIcon}>{mod.icon}</Text>
      </View>
      <View style={styles.moduleBody}>
        <Text style={[styles.moduleTitle, { color: mod.accentColor }]}>
          {mod.title}
        </Text>
        <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
      </View>
      <Text style={[styles.chevron, { color: mod.accentColor }]}>›</Text>
    </Card>
  );
}

function QuickTipsCard() {
  return (
    <Card style={styles.tipsCard}>
      <View style={styles.tipsHeader}>
        <Text style={styles.tipsHeaderIcon}>💡</Text>
        <Text style={styles.tipsHeaderTitle}>Quick Tips</Text>
      </View>
      {TIPS.map((tip, index) => (
        <View
          key={index}
          style={[styles.tipRow, index < TIPS.length - 1 && styles.tipDivider]}
        >
          <Text style={styles.tipBulletIcon}>{tip.icon}</Text>
          <Text style={styles.tipText}>{tip.text}</Text>
        </View>
      ))}
    </Card>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#43A047']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Logo */}
        <View style={styles.logoCircle}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appTitle}>Aloe Mate</Text>
        <Text style={styles.appSubtitle}>AI-Powered Plant Health Assistant</Text>
      </LinearGradient>

      {/* ── Body ── */}
      <View style={styles.body}>
        <Text style={styles.sectionTitle}>What do you need today?</Text>

        {MODULES.map((mod) => (
          <ModuleCard
            key={mod.id}
            mod={mod}
            onPress={() => router.push(mod.route as any)}
          />
        ))}

        <Text style={[styles.sectionTitle, styles.tipsSectionTitle]}>
          Quick Tips
        </Text>
        <QuickTipsCard />
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xl,
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 36,
    paddingHorizontal: Spacing.lg,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: Spacing.xs,
    letterSpacing: 0.2,
  },

  // ── Body ──
  body: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tipsSectionTitle: {
    marginTop: Spacing.lg,
  },

  // ── Module Card ──
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderRadius: 14,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  moduleIcon: {
    fontSize: 26,
  },
  moduleBody: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  moduleTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: 3,
    lineHeight: 20,
  },
  moduleSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: Typography.weights.bold,
    flexShrink: 0,
  },

  // ── Quick Tips Card ──
  tipsCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 14,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xs,
  },
  tipsHeaderIcon: {
    fontSize: 18,
  },
  tipsHeaderTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  tipDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tipBulletIcon: {
    fontSize: 15,
    marginTop: 1,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
