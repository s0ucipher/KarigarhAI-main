import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

export default function ArtisanProfileSelf({ navigation }) {
  const { user, logout } = useAuth();
  const [me, setMe] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await api.get('/api/auth/me').catch(() => null);
      if (data) setMe(data.user || data);
    })();
  }, []);
  return (
    <Screen>
      <AppHeader title="Profile" subtitle={user?.email || ''} />
      <View style={styles.card}>
        <Text style={styles.name}>{me?.name || user?.name || 'Artisan'}</Text>
        <Text style={styles.muted}>{me?.seller_profile?.craft_specialization || 'Handmade crafts'}</Text>
        {me?.seller_profile?.location ? <Text style={styles.muted}>📍 {me.seller_profile.location}</Text> : null}
      </View>
      <TouchableOpacity style={styles.row} onPress={() => logout().then(() => navigation.replace('Login'))}>
        <Text style={styles.logout}>Log out</Text>
      </TouchableOpacity>
      <View style={{ height: 90 }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 16 },
  name: { fontSize: 18, fontWeight: '800', color: Colors.charcoal },
  muted: { color: Colors.muted, marginTop: 4 },
  row: { marginTop: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 16 },
  logout: { color: Colors.danger, fontWeight: '700' },
});
