import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const EditEmailScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Por favor, introduce un correo electrónico válido');
      return;
    }

    if (email === user?.email) {
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      await authService.updateUserEmail(email);
      Alert.alert('Éxito', 'Correo electrónico actualizado correctamente');
      navigation.goBack();
    } catch (e: any) {
      if (e.includes('requires-recent-login')) {
        Alert.alert('Por seguridad', 'Debes cerrar sesión y volver a entrar antes de cambiar el correo.');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el correo. Comprueba que no esté en uso.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={styles.title}>Correo Electrónico</Text>
          <Text style={styles.subtitle}>Gestiona tu dirección de contacto</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.infoText}>
              Tu correo electrónico se utiliza para iniciar sesión y enviarte notificaciones sobre tus viajes.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nuevo Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="ejemplo@correo.com"
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
                <Text style={styles.saveButtonText}>Actualizar Correo</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  content: { flex: 1 },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    alignItems: 'center',
  },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#005BB5', lineHeight: 20 },
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

export default EditEmailScreen;
