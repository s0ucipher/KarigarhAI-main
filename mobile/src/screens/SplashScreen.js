import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../theme';
import { useAuth } from '../auth/AuthContext';

export default function SplashScreen({ navigation }) {
  const { loading, user, role } = useAuth();
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user) navigation.replace(role === 'seller' ? 'ArtisanApp' : 'BuyerApp');
      else navigation.replace('Onboarding');
    }, 1200);
    return () => clearTimeout(t);
  }, [loading, user]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.motif}>🏺</Text>
      <Text style={styles.brand}>KalaSetu AI</Text>
      <Text style={styles.tag}>Handmade crafts, AI-assisted catalogues</Text>
      <ActivityIndicator style={{ marginTop: 24 }} color={Colors.terracotta} />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.ivory, alignItems: 'center', justifyContent: 'center' },
  motif: { fontSize: 64 },
  brand: { fontSize: 32, fontWeight: '800', color: Colors.sageDeep, marginTop: 12 },
  tag: { fontSize: 14, color: Colors.muted, marginTop: 6 },
});
