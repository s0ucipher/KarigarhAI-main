import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

export default function BuyerProfile({ navigation }) {
  const { user, lang, switchLang, logout } = useAuth();
  return (
    <Screen>
      <AppHeader title="Profile" subtitle={user?.email || ''} />
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name || 'Buyer'}</Text>
        <Text style={styles.muted}>Preferred language: {lang.toUpperCase()}</Text>
        <View style={styles.langRow}>
          {['en', 'hi', 'bn'].map((l) => (
            <TouchableOpacity key={l} style={[styles.lang, lang === l && styles.langActive]} onPress={() => switchLang(l)}>
              <Text style={styles.langT}>{l.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  langRow: { flexDirection: 'row', marginTop: 12 },
  lang: { borderWidth: 1, borderColor: Colors.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 },
  langActive: { backgroundColor: Colors.sageDeep, borderColor: Colors.sageDeep },
  langT: { fontWeight: '700', color: Colors.charcoal },
  row: { marginTop: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 16 },
  logout: { color: Colors.danger, fontWeight: '700' },
});
