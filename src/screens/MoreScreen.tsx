import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';
import { tripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const MoreScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { activeTrip, setActiveTrip } = useTrip();

  const isOrganizer = activeTrip?.organizers?.includes(user?.uid || '') || user?.uid === activeTrip?.userId;

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigation.navigate('Login');
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const handleDeleteTrip = () => {
    if (!activeTrip?.id) return;

    Alert.alert(
      'Eliminar Viaje',
      '¿Estás seguro de que quieres eliminar este viaje para todos? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await tripService.deleteTrip(activeTrip.id!);
              setActiveTrip(null);
              navigation.navigate('Start');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el viaje');
            }
          }
        }
      ]
    );
  };

  const handleLeaveTrip = () => {
    if (!activeTrip?.id || !user?.uid) return;

    Alert.alert(
      'Abandonar Viaje',
      '¿Estás seguro de que quieres salir de este viaje? Ya no podrás ver sus detalles.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: async () => {
            try {
              await tripService.leaveTrip(activeTrip.id!, user.uid);
              setActiveTrip(null);
              navigation.navigate('Start');
            } catch (error) {
              Alert.alert('Error', 'No se pudo abandonar el viaje');
            }
          }
        }
      ]
    );
  };

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSpacer} />

        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Más Opciones</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gestión detallada de tu viaje actual</Text>
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
              title="Caja Fuerte"
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  topSpacer: { height: 0, marginBottom: 15 },
  headerSection: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, marginLeft: 8 },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 17, fontWeight: '600' },
  menuSubtitle: { fontSize: 13, marginTop: 2 },
  separator: { height: 1, marginLeft: 76 },
});

export default MoreScreen;
