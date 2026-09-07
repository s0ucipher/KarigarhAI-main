import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Colors, Radius } from '../theme';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../auth/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // login | signup
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return Alert.alert('Missing details', 'Please enter email and password.');
    setBusy(true);
    try {
      const u =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register({ name: name || 'KalaSetu User', email: email.trim(), password, role });
      navigation.replace(u.role === 'seller' ? 'ArtisanApp' : 'BuyerApp');
    } catch (e) {
      Alert.alert('Authentication failed', e.response?.data?.detail || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.brand}>KalaSetu AI</Text>
      <Text style={styles.sub}>AI-powered commerce assistant for Indian artisans</Text>

      {mode === 'signup' && (
        <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
      )}
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

      {mode === 'signup' && (
        <View style={styles.roleRow}>
          {['buyer', 'seller'].map((r) => (
            <TouchableOpacity key={r} style={[styles.role, role === r && styles.roleActive]} onPress={() => setRole(r)}>
              <Text style={styles.roleText}>{r === 'seller' ? '🧶 I am an Artisan' : '🛍️ I am a Buyer'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <PrimaryButton title={busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'} onPress={submit} disabled={busy} />

      <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ marginTop: 14 }}>
        <Text style={styles.link}>{mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}</Text>
      </TouchableOpacity>

      <View style={styles.divider}><Text style={styles.divText}>More sign-in options</Text></View>
      {['Continue with Google', 'Continue with Apple', 'Continue with Phone / OTP'].map((label) => (
        <TouchableOpacity
          key={label}
          style={styles.oauth}
          onPress={() =>
            Alert.alert(
              'Not configured',
              `${label} needs backend OAuth credentials. Email sign-in works now; this option will activate once keys are provisioned. No demo login is created.`
            )
          }
        >
          <Text style={styles.oauthText}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.background },
  brand: { fontSize: 28, fontWeight: '800', color: Colors.sageDeep, marginTop: 24 },
  sub: { fontSize: 14, color: Colors.muted, marginBottom: 20, marginTop: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, minHeight: 52, paddingHorizontal: 14, fontSize: 15, marginBottom: 12 },
  roleRow: { flexDirection: 'row', marginBottom: 12 },
  role: { flex: 1, borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 14, marginHorizontal: 4, backgroundColor: '#fff' },
  roleActive: { borderColor: Colors.terracotta, backgroundColor: Colors.cream },
  roleText: { fontWeight: '600', color: Colors.charcoal },
  link: { color: Colors.terracottaDeep, fontWeight: '700', textAlign: 'center' },
  divider: { marginVertical: 18, alignItems: 'center' },
  divText: { color: Colors.muted, fontSize: 12 },
  oauth: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  oauthText: { fontWeight: '600', color: Colors.charcoal },
});
