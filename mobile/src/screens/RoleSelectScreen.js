import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius } from '../theme';
import { useAuth } from '../auth/AuthContext';

// Asked once after first login. Data-minimal: only the role.
export default function RoleSelectScreen({ navigation, route }) {
  const { user, role } = useAuth();
  const go = (r) => navigation.replace(r === 'seller' ? 'ArtisanApp' : 'BuyerApp');
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>KalaSetu AI</Text>
      <Text style={styles.q}>What brings you to KalaSetu AI?</Text>
      <TouchableOpacity style={styles.opt} onPress={() => go('seller')}>
        <Text style={styles.emoji}>🧶</Text>
        <Text style={styles.optT}>I am an Artisan</Text>
        <Text style={styles.optS}>Sell my handmade crafts with AI help</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.opt} onPress={() => go('buyer')}>
        <Text style={styles.emoji}>🛍️</Text>
        <Text style={styles.optT}>I am a Buyer</Text>
        <Text style={styles.optS}>Discover crafts directly from makers</Text>
      </TouchableOpacity>
      {(role || route.params?.freshRole) ? (
        <Text style={styles.hint}>Signed in as {user?.name || user?.email}</Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.background, padding: 20, justifyContent: 'center' },
  brand: { fontSize: 26, fontWeight: '800', color: Colors.sageDeep, textAlign: 'center' },
  q: { fontSize: 19, fontWeight: '700', color: Colors.charcoal, textAlign: 'center', marginVertical: 18 },
  opt: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.lg, padding: 20, marginBottom: 12 },
  emoji: { fontSize: 34 },
  optT: { fontSize: 17, fontWeight: '700', color: Colors.charcoal, marginTop: 8 },
  optS: { fontSize: 13, color: Colors.muted, marginTop: 4 },
  hint: { textAlign: 'center', color: Colors.muted, marginTop: 8 },
});
