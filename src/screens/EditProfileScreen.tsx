import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, userData } = useAuth();
  
  const [name, setName] = useState(user?.displayName || '');
  const [imageUri, setImageUri] = useState<string | null>(userData?.photoURL || null);
  const [loading, setLoading] = useState(false);

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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      let photoURL = user?.photoURL;
      
      // Si seleccionó una imagen nueva (que ahora es el string base64)
      if (imageUri && imageUri !== user?.photoURL) {
        photoURL = imageUri;
      }

      await authService.updateUserProfile({
        displayName: name,
        photoURL: photoURL || undefined
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={showImageOptions} style={styles.avatarContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.avatarGradient}>
                <Ionicons name="person" size={50} color="#fff" />
              </LinearGradient>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toca para cambiar la foto</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre completo"
            placeholderTextColor="#8E8E93"
          />
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#E5E5EA', '#D1D1D6'] : ['#007AFF', '#00C6FF']}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  content: { padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatarContainer: { position: 'relative' },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarGradient: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: { marginTop: 16, fontSize: 14, color: '#8E8E93' },
  formGroup: { marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#3A3A3C', marginBottom: 8 },
  input: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  saveButton: { borderRadius: 16, overflow: 'hidden' },
  gradientButton: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditProfileScreen;
