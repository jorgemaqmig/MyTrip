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

const { width, height } = Dimensions.get('window');

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user, userData } = useAuth();
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
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: isDestructive ? '#FF3B3015' : (color ? color + '15' : '#F2F2F7') }]}>
        <Ionicons name={icon} size={22} color={isDestructive ? '#FF3B30' : (color || '#8E8E93')} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, isDestructive && { color: '#FF3B30' }]}>{title}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cabecera unificada */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Personaliza tu perfil y preferencias</Text>
        </View>

        {/* Perfil Principal */}
        <View style={styles.profileCard}>
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
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userData?.displayName || user?.displayName || 'Usuario'}</Text>
            <View style={styles.emailBadge}>
              <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
              {isGoogleUser && (
                <View style={styles.googleBadge}>
                  <Ionicons name="logo-google" size={10} color="#4285F4" />
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Cuenta</Text>
          <View style={styles.card}>
            <SettingItem
              icon="person-outline"
              title="Editar Perfil"
              subtitle="Nombre y foto"
              color="#007AFF"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={styles.separator} />
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
            <View style={styles.separator} />
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
          <Text style={styles.sectionTitle}>Preferencias</Text>
          <View style={styles.card}>
            <SettingItem
              icon="notifications-outline"
              title="Notificaciones"
              color="#FF9500"
              onPress={() => navigation.navigate('Notifications')}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="color-palette-outline"
              title="Apariencia"
              subtitle="Modo claro / oscuro"
              color="#AF52DE"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión de Cuenta</Text>
          <View style={styles.card}>
            <SettingItem
              icon="log-out-outline"
              title="Cerrar Sesión"
              color="#FF3B30"
              onPress={handleLogout}
            />
            <View style={styles.separator} />
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={['#4285F415', '#fff']}
              style={styles.modalGradient}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons name="logo-google" size={40} color="#4285F4" />
                <View style={styles.modalLockBadge}>
                  <Ionicons name="lock-closed" size={12} color="#fff" />
                </View>
              </View>

              <Text style={styles.modalTitle}>Correo gestionado por Google</Text>
              <Text style={styles.modalText}>
                Tu cuenta está vinculada a Google. Por seguridad, cualquier cambio en tu dirección de correo debe realizarse directamente en la configuración de tu cuenta de Google.
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

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
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
    borderColor: '#F2F2F7',
  },
  profileInfo: { flex: 1, marginLeft: 20 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  emailBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userEmail: { fontSize: 13, color: '#8E8E93', flexShrink: 1 },
  googleBadge: { backgroundColor: '#fff', padding: 4, borderRadius: 8 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 12, marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7' },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  iconContainer: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },
  settingSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 68 },

  footer: { paddingVertical: 20, alignItems: 'center' },
  versionText: { fontSize: 14, color: '#D1D1D6', fontWeight: 'bold' },
  footerInfo: { fontSize: 12, color: '#D1D1D6', marginTop: 4 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#3A3A3C',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
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
  modalSecondaryButton: {
    paddingVertical: 12,
  },
  modalSecondaryButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen;
