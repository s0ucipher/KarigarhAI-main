import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme';
import { PrimaryButton } from '../../components/ui';

export default function PublishedSuccess({ navigation, route }) {
  const { product } = route.params || {};
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Product published!</Text>
      <Text style={styles.sub}>{product?.title || product?.name || 'Your craft is live in the marketplace.'}</Text>
      <PrimaryButton
        title="View in My Products"
        onPress={() => navigation.navigate('ArtisanApp', { screen: 'MyProductsTab' })}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center' },
  emoji: { fontSize: 64, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.sageDeep, textAlign: 'center', marginTop: 12 },
  sub: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginVertical: 12 },
});
