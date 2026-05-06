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
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const SecurityScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');

  const handleSave = async () => {
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authService.updateUserPassword(password);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      navigation.goBack();
    } catch (e: any) {
      if (e.includes('requires-recent-login')) {
        Alert.alert('Por seguridad', 'Debes cerrar sesión y volver a entrar antes de cambiar tu contraseña.');
      } else {
        Alert.alert('Error', 'No se pudo actualizar la contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Seguridad</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Protege tu cuenta y tus datos</Text>
        </View>

        <View style={styles.content}>
          {isGoogleUser ? (
            <View style={styles.googleUserContainer}>
              <LinearGradient
                colors={isDark ? ['#1C1C1E', '#1C1C1E'] : ['#4285F410', '#4285F405']}
                style={[styles.googleCard, { borderColor: isDark ? colors.border : '#4285F420' }]}
              >
                <View style={styles.googleHeader}>
                  <Ionicons name="logo-google" size={40} color="#4285F4" />
                  <View style={styles.badge}>
                    <Ionicons name="shield-checkmark" size={14} color="#fff" />
                    <Text style={styles.badgeText}>Vinculada</Text>
                  </View>
                </View>
                
                <Text style={[styles.googleTitle, { color: colors.text }]}>Cuenta Protegida</Text>
                <Text style={[styles.googleSubtitle, { color: colors.textSecondary }]}>
                  Tu sesión está gestionada por Google. Tu seguridad y contraseña dependen de tu configuración de Google Account.
                </Text>
                
                <TouchableOpacity 
                  style={styles.externalButton}
                  onPress={() => Alert.alert('Información', 'Para gestionar tu contraseña, visita la configuración de tu cuenta de Google.')}
                >
                  <Text style={styles.externalButtonText}>Gestionar en Google</Text>
                  <Ionicons name="open-outline" size={18} color="#4285F4" />
                </TouchableOpacity>
              </LinearGradient>

              <View style={[styles.tipBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFF9F2' }]}>
                <Ionicons name="bulb-outline" size={20} color={isDark ? colors.primary : "#FF9500"} />
                <Text style={[styles.tipText, { color: isDark ? colors.textSecondary : "#A05E03" }]}>
                  Al usar Google, disfrutas de autenticación en dos pasos y mayor protección sin necesidad de recordar otra contraseña.
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <View style={[styles.infoBox, { backgroundColor: isDark ? '#1C1C1E' : '#F0FFF4' }]}>
                <Ionicons name="shield-checkmark-outline" size={24} color={isDark ? colors.primary : "#34C759"} />
                <Text style={[styles.infoText, { color: isDark ? colors.textSecondary : "#148734" }]}>
                  Usa una contraseña segura de al menos 6 caracteres. Te recomendamos combinar letras y números.
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Nueva Contraseña</Text>
                <View style={[styles.passwordContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Confirmar Contraseña</Text>
                <View style={[styles.passwordContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
                disabled={loading || !password || !confirmPassword}
              >
                <LinearGradient
                  colors={(loading || !password || !confirmPassword) ? [colors.border, colors.border] : ['#5856D6', '#8E8DFF']}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Actualizar Contraseña</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  
  // Google User Styles
  googleUserContainer: { alignItems: 'center' },
  googleCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  googleHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  badge: { 
    backgroundColor: '#34C759', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8,
    marginLeft: -10,
    marginTop: 25,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 2 },
  googleTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  googleSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  externalButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  externalButtonText: { color: '#4285F4', fontWeight: 'bold', fontSize: 16 },
  tipBox: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 16, 
    marginTop: 24, 
    gap: 12,
    alignItems: 'center'
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Form Styles
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    alignItems: 'center',
  },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, lineHeight: 20 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeIcon: { padding: 14 },
  saveButton: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  gradientButton: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default SecurityScreen;
