import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user, userData } = useAuth();
  const { colors, isDark } = useTheme();
  const [showGoogleEmailModal, setShowGoogleEmailModal] = useState(false);

  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigation.replace('Login');
    } catch (e) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const SettingItem = ({ icon, title, subtitle, onPress, color, isDestructive }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: isDestructive ? '#FF3B3015' : (color ? color + '15' : colors.border) }]}>
        <Ionicons name={icon} size={22} color={isDestructive ? '#FF3B30' : (color || colors.textSecondary)} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }, isDestructive && { color: '#FF3B30' }]}>{title}</Text>
        {subtitle ? <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.border === '#F2F2F7' ? '#C7C7CC' : '#48484A'} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cabecera unificada */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Configuración</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Personaliza tu perfil y preferencias</Text>
        </View>

        {/* Perfil Principal */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatarWrapper}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#007AFF', '#00C6FF']}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={40} color="#fff" />
              </LinearGradient>
            )}
            <TouchableOpacity
              style={[styles.editAvatarButton, { borderColor: colors.card }]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{userData?.displayName || user?.displayName || 'Usuario'}</Text>
            <View style={styles.emailBadge}>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>{user?.email}</Text>
              {isGoogleUser && (
                <View style={[styles.googleBadge, { backgroundColor: isDark ? '#2C2C2E' : '#fff' }]}>
                  <Ionicons name="logo-google" size={10} color="#4285F4" />
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Mi Cuenta</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingItem
              icon="person-outline"
              title="Editar Perfil"
              subtitle="Nombre y foto"
              color="#007AFF"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={[styles.separator, { backgroundColor: colors.separator }]} />
            <SettingItem
              icon="mail-outline"
              title="Correo Electrónico"
              subtitle={isGoogleUser ? "Gestionado por Google" : (user?.email || '')}
              color="#32ADE6"
              onPress={() => {
                if (isGoogleUser) {
                  setShowGoogleEmailModal(true);
                } else {
                  navigation.navigate('EditEmail');
                }
              }}
            />
            <View style={[styles.separator, { backgroundColor: colors.separator }]} />
            <SettingItem
              icon="lock-closed-outline"
              title="Seguridad"
              subtitle={isGoogleUser ? "Cuenta protegida por Google" : "Cambiar contraseña"}
              color="#5856D6"
              onPress={() => navigation.navigate('Security')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferencias</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingItem
              icon="notifications-outline"
              title="Notificaciones"
              color="#FF9500"
              onPress={() => navigation.navigate('Notifications')}
            />
            <View style={[styles.separator, { backgroundColor: colors.separator }]} />
            <SettingItem
              icon="color-palette-outline"
              title="Apariencia"
              subtitle="Modo claro / oscuro"
              color="#AF52DE"
              onPress={() => navigation.navigate('Appearance')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Gestión de Cuenta</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingItem
              icon="log-out-outline"
              title="Cerrar Sesión"
              color="#FF3B30"
              onPress={handleLogout}
            />
            <View style={[styles.separator, { backgroundColor: colors.separator }]} />
            <SettingItem
              icon="trash-outline"
              title="Eliminar Cuenta"
              subtitle="Esta acción no se puede deshacer"
              isDestructive={true}
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal Personalizado de Google Email */}
      <Modal
        visible={showGoogleEmailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGoogleEmailModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <LinearGradient
              colors={isDark ? ['#1C1C1E', '#1C1C1E'] : ['#4285F415', '#fff']}
              style={styles.modalGradient}
            >
              <View style={[styles.modalIconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#fff' }]}>
                <Ionicons name="logo-google" size={40} color="#4285F4" />
                <View style={styles.modalLockBadge}>
                  <Ionicons name="lock-closed" size={12} color="#fff" />
                </View>
              </View>

              <Text style={[styles.modalTitle, { color: colors.text }]}>Correo gestionado por Google</Text>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                Tu cuenta está vinculada a Google. Por seguridad, cualquier cambio en tu dirección de correo debe realizarse directamente en tu cuenta de Google.
              </Text>

              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowGoogleEmailModal(false)}
              >
                <LinearGradient
                  colors={['#4285F4', '#4285F4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Entendido</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
  
  // Profile Card
  profileCard: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
  },
  avatarWrapper: { position: 'relative' },
  avatarGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  editAvatarButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#007AFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  profileInfo: { flex: 1, marginLeft: 20 },
  userName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  emailBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userEmail: { fontSize: 13, flexShrink: 1 },
  googleBadge: { padding: 4, borderRadius: 8 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, marginLeft: 8 },
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  iconContainer: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500' },
  settingSubtitle: { fontSize: 13, marginTop: 2 },
  separator: { height: 1, marginLeft: 68 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  modalGradient: {
    padding: 32,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative'
  },
  modalLockBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#EA4335',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
