import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user, userData } = useAuth();

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
                  Alert.alert('Información', 'Tu correo está vinculado a Google. Debes cambiarlo desde tu cuenta de Google.');
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
        
        <View style={styles.footer}>
          <Text style={styles.versionText}>MyTrip v1.0.0</Text>
          <Text style={styles.footerInfo}>Hecho para tu TFG</Text>
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
});

export default SettingsScreen;
