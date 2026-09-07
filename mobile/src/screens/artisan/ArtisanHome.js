import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/client';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

export default function ArtisanHome({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  useFocusEffect(useCallback(() => {
    (async () => {
      const { data } = await api.get('/api/seller/dashboard').catch(() => null);
      if (data) setStats(data.stats || data);
    })();
  }, []));

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader title={`Namaste, ${user?.name?.split(' ')[0] || 'Artisan'} 🙏`} subtitle="Turn your craft into a digital listing." />
        <View style={styles.hero}>
          <Text style={styles.heroT}>Add a photo or tell us about your product.</Text>
          <Text style={styles.heroS}>AI enhances the photo, writes the catalogue, and suggests a fair price. You always approve.</Text>
          <PrimaryButton title="➕  Create Product" onPress={() => navigation.navigate('CreateTab')} />
        </View>
        <View style={styles.grid}>
          {[
            ['🏺 Products', stats?.total_products ?? '–', 'MyProductsTab'],
            ['📦 Orders to ship', stats?.active_orders_count ?? '–', 'DashboardTab'],
            ['💰 Earnings ₹', stats?.total_earnings ?? '–', 'DashboardTab'],
            ['💬 Enquiries', 'View', 'DashboardTab'],
          ].map(([label, val, dest]) => (
            <TouchableOpacity key={label} style={styles.stat} onPress={() => navigation.navigate(dest)}>
              <Text style={styles.statV}>{val}</Text>
              <Text style={styles.statL}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: { backgroundColor: Colors.sageDeep, borderRadius: Radius.lg, padding: 20 },
  heroT: { color: '#fff', fontSize: 18, fontWeight: '800' },
  heroS: { color: '#EDE7DA', fontSize: 13, marginVertical: 10, lineHeight: 19 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  stat: { width: '47%', backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 16, margin: '1.5%' },
  statV: { fontSize: 20, fontWeight: '800', color: Colors.charcoal },
  statL: { fontSize: 12, color: Colors.muted, marginTop: 4 },
});
