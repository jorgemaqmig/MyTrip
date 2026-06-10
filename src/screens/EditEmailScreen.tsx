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
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

// Pantalla de edición de correo electrónico
const EditEmailScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  
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
      const errorMessage = e.toString();
      if (errorMessage.includes('requires-recent-login')) {
        Alert.alert('Seguridad', 'Por razones de seguridad, debes haber iniciado sesión recientemente para cambiar tu correo. Por favor, cierra sesión y vuelve a entrar.');
      } else if (errorMessage.includes('email-already-in-use')) {
        Alert.alert('Error', 'Este correo ya está registrado en otra cuenta.');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el correo. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderiza la pantalla de edición de correo electrónico
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Correo Electrónico</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gestiona tu dirección de contacto</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.infoBox, { backgroundColor: isDark ? '#2C2C2E' : '#F0F7FF', borderColor: isDark ? colors.border : '#CCE5FF', borderWidth: 1 }]}>
            <Ionicons name="information-circle" size={24} color={isDark ? colors.primary : "#007AFF"} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Tu correo se utiliza para iniciar sesión y enviarte notificaciones importantes sobre tus viajes.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>NUEVO CORREO ELECTRÓNICO</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', 
                color: colors.text,
                borderColor: colors.border,
                borderWidth: isDark ? 1 : 0
              }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="ejemplo@correo.com"
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

// Estilos para la pantalla de edición de correo electrónico
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
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    alignItems: 'center',
  },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, lineHeight: 20 },
  formGroup: { marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  saveButton: { borderRadius: 16, overflow: 'hidden' },
  gradientButton: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditEmailScreen;
