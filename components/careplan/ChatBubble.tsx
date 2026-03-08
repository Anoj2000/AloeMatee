import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export function ChatBubble({ role, text, timestamp }: ChatBubbleProps) {
  const isUser = role === 'user';
  const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperBot]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textBot]}>{text}</Text>
      </View>
      <Text style={[styles.time, isUser ? styles.timeUser : null]}>{timeStr}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.sm, maxWidth: '80%' },
  wrapperUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapperBot: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 16, padding: Spacing.sm },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  text: { fontSize: Typography.sizes.sm, lineHeight: 20 },
  textUser: { color: '#fff' },
  textBot: { color: Colors.textPrimary },
  time: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  timeUser: { textAlign: 'right' },
});
