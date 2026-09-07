import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';
import { PrimaryButton } from '../components/ui';

const STEPS = [
  { e: '📸', t: 'Photo to catalogue', s: 'Snap your craft. AI enhances the photo and drafts the listing.' },
  { e: '🎙️', t: 'Speak, don’t type', s: 'Describe your product by voice in Hindi, Bengali or English.' },
  { e: '🤝', t: 'Meet buyers directly', s: 'Publish to the marketplace and receive enquiries with no middlemen.' },
];

export default function OnboardingScreen({ navigation }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>KalaSetu AI</Text>
      {STEPS.map((s) => (
        <View key={s.t} style={styles.card}>
          <Text style={styles.emoji}>{s.e}</Text>
          <Text style={styles.title}>{s.t}</Text>
          <Text style={styles.sub}>{s.s}</Text>
        </View>
      ))}
      <PrimaryButton title="Get Started" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.background, padding: 20, justifyContent: 'center' },
  brand: { fontSize: 28, fontWeight: '800', color: Colors.sageDeep, textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: Colors.line },
  emoji: { fontSize: 30 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.charcoal, marginTop: 8 },
  sub: { fontSize: 14, color: Colors.muted, marginTop: 4 },
});
