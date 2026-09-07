import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Radius } from '../../theme';
import { Screen, AppHeader, PrimaryButton } from '../../components/ui';

// Step 1 of the wizard: real device Camera / Photos / Files via expo-image-picker.
export default function CreateProduct({ navigation }) {
  const [image, setImage] = useState(null);

  const pick = async (fn, label) => {
    const perm = label === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', `Allow ${label} access to add a product photo.`);
    const res = await fn();
    if (!res.canceled && res.assets?.[0]) setImage(res.assets[0]);
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets?.[0]) setImage(res.assets[0]);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader title="Create Product" subtitle="Step 1 of 5 — add a product photo" />
        {image ? <Image source={{ uri: image.uri }} style={styles.preview} /> : (
          <View style={styles.placeholder}><Text style={styles.phEmoji}>📸</Text><Text style={styles.phT}>No photo yet</Text></View>
        )}
        <TouchableOpacity style={styles.opt} onPress={() => pick(() => ImagePicker.launchCameraAsync({ quality: 0.85 }), 'camera')}>
          <Text style={styles.optT}>📷  Take photo with camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.opt} onPress={() => pick(() => ImagePicker.launchImageLibraryAsync({ quality: 0.85 }), 'photos')}>
          <Text style={styles.optT}>🖼️  Choose from gallery / photos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.opt} onPress={pickFile}>
          <Text style={styles.optT}>📁  Choose image from files</Text>
        </TouchableOpacity>
        {image && (
          <TouchableOpacity onPress={() => setImage(null)}><Text style={styles.remove}>Remove photo</Text></TouchableOpacity>
        )}
        <View style={{ height: 12 }} />
        <PrimaryButton title="Continue → Enhance Photo" disabled={!image}
          onPress={() => navigation.navigate('ImageStudio', { image })} />
        <View style={{ height: 90 }} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  preview: { width: '100%', height: 300, borderRadius: Radius.lg },
  placeholder: { height: 220, borderRadius: Radius.lg, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.line },
  phEmoji: { fontSize: 52 },
  phT: { color: Colors.muted, marginTop: 8 },
  opt: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.md, padding: 16, marginTop: 10, minHeight: 56, justifyContent: 'center' },
  optT: { fontWeight: '600', color: Colors.charcoal, fontSize: 15 },
  remove: { color: Colors.danger, textAlign: 'center', marginTop: 10, fontWeight: '600' },
});
