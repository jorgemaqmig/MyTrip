import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

// Pantalla de edición de perfil
const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, userData } = useAuth();
  const { colors, isDark } = useTheme();
  
  const [name, setName] = useState(user?.displayName || '');
  const [imageUri, setImageUri] = useState<string | null>(userData?.photoURL || null);
  const [loading, setLoading] = useState(false);

  // Muestra opciones para cambiar la foto de perfil
  const showImageOptions = () => {
    Alert.alert(
      'Cambiar foto de perfil',
      'Selecciona una opción',
      [
        { text: 'Cámara', onPress: takePhoto },
        { text: 'Galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Toma una foto usando la cámara
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Atención', 'Necesitamos acceso a tu cámara');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageUri(base64Image);
    }
  };

  // Selecciona una imagen de la galería
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Atención', 'Necesitamos acceso a tu galería');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageUri(base64Image);
    }
  };

  // Guarda los cambios en el perfil
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      await authService.updateUserProfile({
        displayName: name,
        photoURL: imageUri || undefined
      });
      
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Renderiza la pantalla de edición de perfil
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Mi Perfil</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Personaliza tu identidad en MyTrip</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={showImageOptions} style={styles.avatarContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#E1E1E1' }]}>
                  <Ionicons name="person" size={50} color={isDark ? '#48484A' : '#A9A9A9'} />
                </View>
              )}
              <LinearGradient 
                colors={[colors.primary, isDark ? '#47a1ff' : '#0056b3']} 
                style={styles.editBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="camera" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: colors.primary, fontWeight: '600' }]}>Cambiar foto</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>NOMBRE COMPLETO</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', 
                color: colors.text,
                borderColor: colors.border,
                borderWidth: isDark ? 1 : 0
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre completo"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [colors.border, colors.border] : [colors.primary, isDark ? '#47a1ff' : '#0056b3']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Estilos para la pantalla de edición de perfil
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  content: { flex: 1 },
  avatarSection: { alignItems: 'center', marginBottom: 40 },
  avatarContainer: { position: 'relative' },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarHint: { marginTop: 12, fontSize: 14 },
  formGroup: { marginBottom: 32 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  saveButton: { borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  gradientButton: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditProfileScreen;
