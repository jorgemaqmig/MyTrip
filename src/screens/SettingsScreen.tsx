import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

import { authService } from '../services/authService';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user, userData } = useAuth();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigation.navigate('Login');
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const SettingItem = ({ icon, title, subtitle, color, isDestructive = false, onPress }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: isDestructive ? '#FFF0F0' : '#F2F2F7' }]}>
        <Ionicons name={icon} size={22} color={isDestructive ? '#FF3B30' : color || '#007AFF'} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, isDestructive ? { color: '#FF3B30' } : null]}>{title}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {userData?.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={{ width: 100, height: 100, borderRadius: 50 }} />
            ) : (
              <LinearGradient
                colors={['#007AFF', '#00C6FF']}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={50} color="#fff" />
              </LinearGradient>
            )}
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.displayName || 'Viajero'}</Text>

          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Cuenta</Text>
          <View style={styles.card}>
            <SettingItem 
              icon="person-outline" 
              title="Editar Perfil" 
              subtitle="Nombre, foto y biografía"
              color="#007AFF"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={styles.separator} />
            <SettingItem 
              icon="mail-outline" 
              title="Correo Electrónico" 
              subtitle={user?.email || ''}
              color="#32ADE6"
              onPress={() => navigation.navigate('EditEmail')}
            />
            <View style={styles.separator} />
            <SettingItem 
              icon="lock-closed-outline" 
              title="Seguridad" 
              subtitle="Cambiar contraseña"
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
              icon="trash-outline" 
              title="Eliminar Cuenta" 
              subtitle="Esta acción no se puede deshacer"
              isDestructive={true}
            />
            <View style={styles.separator} />
            <SettingItem 
              icon="log-out-outline" 
              title="Cerrar Sesión" 
              color="#FF3B30"
              onPress={handleLogout}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>MyTrip v1.0.0</Text>
          <Text style={styles.footerInfo}>Hecho con ❤️ para tu TFG</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#1C1C1E',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 68,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#C7C7CC',
    fontWeight: '600',
  },
  footerInfo: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 4,
  },
});

export default SettingsScreen;
