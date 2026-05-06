import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  
  // Estado principal
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Estados secundarios
  const [tripInvites, setTripInvites] = useState(true);
  const [messages, setMessages] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [expenses, setExpenses] = useState(false);

  const toggleMain = (value: boolean) => {
    setNotificationsEnabled(value);
    // Si se desactivan las generales, podríamos desactivar las demás o simplemente ignorarlas en la lógica.
    // El usuario pidió que se queden en gris.
  };

  const NotificationOption = ({ icon, title, subtitle, value, onValueChange, color }: any) => {
    const disabled = !notificationsEnabled;
    return (
      <View style={[styles.optionContainer, disabled && styles.optionDisabled]}>
        <View style={[styles.iconContainer, { backgroundColor: disabled ? '#F2F2F7' : color + '15' }]}>
          <Ionicons name={icon} size={22} color={disabled ? '#C7C7CC' : color} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, disabled && { color: '#8E8E93' }]}>{title}</Text>
          <Text style={[styles.optionSubtitle, disabled && { color: '#C7C7CC' }]}>{subtitle}</Text>
        </View>
        <Switch
          trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          thumbColor="#fff"
          ios_backgroundColor="#E5E5EA"
          onValueChange={onValueChange}
          value={value}
          disabled={disabled}
        />
      </View>
    );
  };

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
          <Text style={styles.title}>Notificaciones</Text>
          <Text style={styles.subtitle}>Controla qué avisos quieres recibir</Text>
        </View>

        {/* Interruptor Principal */}
        <View style={styles.mainToggleContainer}>
          <View style={styles.mainToggleContent}>
            <Text style={styles.mainToggleTitle}>Permitir notificaciones</Text>
            <Text style={styles.mainToggleSubtitle}>Activa o desactiva todas las alertas de MyTrip en este dispositivo.</Text>
          </View>
          <Switch
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#fff"
            ios_backgroundColor="#E5E5EA"
            onValueChange={toggleMain}
            value={notificationsEnabled}
            style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
          />
        </View>

        {/* Opciones Secundarias */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, !notificationsEnabled && { color: '#C7C7CC' }]}>Alertas de Viaje</Text>
          <View style={[styles.card, !notificationsEnabled && { borderColor: '#E5E5EA' }]}>
            <NotificationOption
              icon="mail-unread-outline"
              title="Invitaciones a Viajes"
              subtitle="Cuando alguien te invite a unirte a su grupo"
              color="#007AFF"
              value={tripInvites}
              onValueChange={setTripInvites}
            />
            <View style={styles.separator} />
            <NotificationOption
              icon="calendar-outline"
              title="Recordatorios"
              subtitle="Avisos importantes antes de que empiece el viaje"
              color="#FF9500"
              value={reminders}
              onValueChange={setReminders}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, !notificationsEnabled && { color: '#C7C7CC' }]}>Social y Gastos</Text>
          <View style={[styles.card, !notificationsEnabled && { borderColor: '#E5E5EA' }]}>
            <NotificationOption
              icon="chatbubbles-outline"
              title="Mensajes del Grupo"
              subtitle="Actualizaciones en el tablón o chat del viaje"
              color="#32ADE6"
              value={messages}
              onValueChange={setMessages}
            />
            <View style={styles.separator} />
            <NotificationOption
              icon="wallet-outline"
              title="Nuevos Gastos"
              subtitle="Cuando alguien añada un gasto al bote común"
              color="#5856D6"
              value={expenses}
              onValueChange={setExpenses}
            />
          </View>
        </View>

        {!notificationsEnabled && (
          <View style={styles.disabledInfo}>
            <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
            <Text style={styles.disabledInfoText}>
              Las notificaciones están desactivadas. No recibirás ningún aviso en tu móvil.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
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

  // Main Toggle
  mainToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  mainToggleContent: { flex: 1, marginRight: 16 },
  mainToggleTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  mainToggleSubtitle: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 12, marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7' },
  
  // Options
  optionContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  optionDisabled: { opacity: 0.6 },
  iconContainer: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  optionContent: { flex: 1, paddingRight: 10 },
  optionTitle: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },
  optionSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 68 },

  // Info
  disabledInfo: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA50',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  disabledInfoText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#8E8E93', lineHeight: 20 },
});

export default NotificationsScreen;
