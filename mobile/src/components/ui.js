import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../theme';
import { imgUrl } from '../api/client';

export const Screen = ({ children, style }) => (
  <View style={[styles.screen, style]}>{children}</View>
);

export const AppHeader = ({ title, subtitle, right }) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.brand}>KalaSetu AI</Text>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>
);

export const SearchBar = ({ value, onChangeText, onSubmit, placeholder }) => (
  <View style={styles.searchWrap}>
    <Text style={styles.searchIcon}>⌕</Text>
    <TextInput
      style={styles.search}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      returnKeyType="search"
      placeholder={placeholder || 'Search handmade crafts…'}
      placeholderTextColor={Colors.muted}
    />
  </View>
);

export const PrimaryButton = ({ title, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.primary, disabled && { opacity: 0.5 }]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.85}
  >
    <Text style={styles.primaryText}>{title}</Text>
  </TouchableOpacity>
);

export const Chip = ({ label, icon, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.chipText}>
      {icon ? `${icon}  ` : ''}{label}
    </Text>
  </TouchableOpacity>
);

export const ProductCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.thumb}>
      {imgUrl(item.enhanced_image_url || item.original_image_url)
        ? <Image source={{ uri: imgUrl(item.enhanced_image_url || item.original_image_url) }} style={styles.thumbImage} />
        : <Text style={styles.thumbEmoji}>🏺</Text>}
    </View>
    <Text style={styles.cardTitle} numberOfLines={2}>{item.title || item.name}</Text>
    <Text style={styles.cardPrice}>₹{item.price}</Text>
    <Text style={styles.cardMeta} numberOfLines={1}>{item.seller_name || ''}</Text>
  </TouchableOpacity>
);

export const EmptyState = ({ emoji, title, subtitle }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyEmoji}>{emoji || '🧺'}</Text>
    <Text style={styles.emptyTitle}>{title || 'Nothing here yet'}</Text>
    {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, padding: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  brand: { fontSize: 20, fontWeight: '800', color: Colors.sageDeep, letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.charcoal, marginTop: 4 },
  subtitle: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: Radius.pill, paddingHorizontal: 14, minHeight: 48, borderWidth: 1, borderColor: Colors.line, ...Shadow.card },
  searchIcon: { fontSize: 18, color: Colors.muted, marginRight: 8 },
  search: { flex: 1, fontSize: 15, color: Colors.charcoal, minHeight: 48 },
  primary: { backgroundColor: Colors.terracotta, borderRadius: Radius.md, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 },
  chipActive: { backgroundColor: Colors.sageDeep, borderColor: Colors.sageDeep },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.charcoal },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: Radius.md, padding: 10, margin: 5, borderWidth: 1, borderColor: Colors.line, ...Shadow.card, minWidth: 150 },
  thumb: { height: 110, borderRadius: Radius.sm, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbEmoji: { fontSize: 40 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: Colors.charcoal },
  cardPrice: { fontSize: 15, fontWeight: '800', color: Colors.terracottaDeep, marginTop: 4 },
  cardMeta: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.charcoal, marginTop: 12 },
  emptySub: { fontSize: 13, color: Colors.muted, marginTop: 6, textAlign: 'center' },
});
