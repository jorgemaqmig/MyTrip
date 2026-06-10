import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/authService';
import { tripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

// ── Pantalla Más Opciones ──
const MoreScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { activeTrip, setActiveTrip } = useTrip();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmType, setConfirmType] = useState<'delete' | 'leave'>('delete');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const isOrganizer = activeTrip?.organizers?.includes(user?.uid || '') || user?.uid === activeTrip?.userId;

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigation.navigate('Login');
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  // Funciones para eliminar o abandonar el viaje
  const handleDeleteTrip = () => {
    setConfirmType('delete');
    setConfirmModalVisible(true);
  };

  // Función para abandonar el viaje
  const handleLeaveTrip = () => {
    setConfirmType('leave');
    setConfirmModalVisible(true);
  };

  // Función para confirmar la acción de eliminar o abandonar el viaje
  const handleConfirmAction = async () => {
    if (!activeTrip?.id) return;
    setConfirmLoading(true);
    try {
      if (confirmType === 'delete') {
        await tripService.deleteTrip(activeTrip.id!);
      } else {
        await tripService.leaveTrip(activeTrip.id!, user?.uid || '');
      }
      setActiveTrip(null);
      setConfirmModalVisible(false);
      navigation.navigate('Start');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', confirmType === 'delete' ? 'No se pudo eliminar el viaje' : 'No se pudo abandonar el viaje');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Componente para cada opción del menú
  const MenuItem = ({ icon, title, subtitle, onPress, color }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={isDark ? '#48484A' : '#C7C7CC'} />
    </TouchableOpacity>
  );

  // Renderizado principal
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSpacer} />

        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.flexOne}>
              <Text style={[styles.title, { color: colors.text }]}>Más Opciones</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gestión detallada de tu viaje actual</Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
              onPress={() => navigation.navigate('Start')}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Gestión del Viaje</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MenuItem
              icon="wallet-outline"
              title="Gastos"
              subtitle="Controla el presupuesto del grupo"
              color="#32ADE6"
              onPress={() => navigation.navigate('Gastos')}
            />
            <View style={[styles.separator, { backgroundColor: colors.separator }]} />
            <MenuItem
              icon="document-lock-outline"
              title="Documentos"
              subtitle="Tus documentos importantes offline"
              color="#5856D6"
              onPress={() => navigation.navigate('Documentos')}
            />
            <View style={[styles.separator, { backgroundColor: colors.separator }]} />
            <MenuItem
              icon="people-outline"
              title="Participantes"
              subtitle="Ver quién está en el viaje"
              color="#34C759"
              onPress={() => navigation.navigate('Participantes')}
            />
            {isOrganizer && (
              <>
                <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                <MenuItem
                  icon="share-social-outline"
                  title="Invitar Amigos"
                  subtitle="Comparte el código del viaje"
                  color="#FF9500"
                  onPress={() => navigation.navigate('InviteFriends')}
                />
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Configuración</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {isOrganizer ? (
              <>
                <MenuItem
                  icon="options-outline"
                  title="Ajustes del Viaje"
                  subtitle="Nombre, fechas y más"
                  color="#8E8E93"
                  onPress={() => navigation.navigate('TripSettings')}
                />
                <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                <MenuItem
                  icon="trash-outline"
                  title="Eliminar Viaje"
                  subtitle="Esta acción no se puede deshacer"
                  color="#FF3B30"
                  onPress={handleDeleteTrip}
                />
              </>
            ) : (
              <MenuItem
                icon="log-out-outline"
                title="Abandonar Viaje"
                subtitle="Dejarás de formar parte del grupo"
                color="#FF3B30"
                onPress={handleLeaveTrip}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal de Confirmación de Eliminar / Abandonar */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient
              colors={['#FF3B30', '#D02B20']}
              style={styles.alertIconWrapper}
            >
              <Ionicons 
                name={confirmType === 'delete' ? "trash-outline" : "log-out-outline"} 
                size={40} 
                color="#fff" 
              />
            </LinearGradient>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {confirmType === 'delete' ? '¿Eliminar Viaje?' : '¿Abandonar Viaje?'}
            </Text>
            
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {confirmType === 'delete' 
                ? 'Esta acción es permanente y eliminará el viaje con todo su itinerario y datos para todos los participantes. No se puede deshacer.'
                : 'Esta acción es permanente. Dejarás de formar parte del grupo de viaje y no podrás volver a ver sus detalles.'}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: '#FF3B30' }]}
                onPress={handleConfirmAction}
                disabled={confirmLoading}
              >
                {confirmLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {confirmType === 'delete' ? 'Eliminar Viaje' : 'Abandonar Viaje'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setConfirmModalVisible(false)}
                disabled={confirmLoading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  topSpacer: { height: 0, marginBottom: 15 },
  headerSection: { marginBottom: 32 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  flexOne: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  closeButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, marginLeft: 8 },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 17, fontWeight: '600' },
  menuSubtitle: { fontSize: 13, marginTop: 2 },
  separator: { height: 1, marginLeft: 76 },
  // Modal de Confirmación
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '90%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  alertIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MoreScreen;
