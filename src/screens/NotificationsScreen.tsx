import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

// ── Toggle personalizado ──
const CustomToggle = ({ value, onToggle, disabled, isDark }: { value: boolean; onToggle: () => void; disabled?: boolean, isDark: boolean }) => {
  const translateX = useRef(new Animated.Value(value ? 22 : 0)).current;
  const bgAnim    = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: value ? 22 : 0, useNativeDriver: true, friction: 7, tension: 60 }),
      Animated.timing(bgAnim, { toValue: value ? 1 : 0, useNativeDriver: false, duration: 200 }),
    ]).start();
  }, [value]);

  const trackColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: disabled 
      ? (isDark ? ['#2C2C2E', '#2C2C2E'] : ['#E5E5EA', '#E5E5EA']) 
      : (isDark ? ['#2C2C2E', '#32D74B'] : ['#E5E5EA', '#34C759']),
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => { if (!disabled) onToggle(); }}
      style={styles.toggleTouchable}
    >
      <Animated.View style={[styles.toggleTrack, { backgroundColor: trackColor }]}>  
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }], backgroundColor: '#fff' }]}>
          <Ionicons
            name={value ? 'checkmark' : 'close'}
            size={12}
            color={disabled ? '#C7C7CC' : value ? '#34C759' : '#8E8E93'}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── Pantalla ──
const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [tripInvites, setTripInvites] = useState(true);
  const [messages, setMessages] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [expenses, setExpenses] = useState(false);

  const disabled = !notificationsEnabled;

  const NotificationOption = ({ icon, title, subtitle, value, onToggle, color }: any) => (
    <View style={[styles.optionRow, disabled && styles.optionDisabled]}>
      <View style={[styles.iconBox, { backgroundColor: disabled ? (isDark ? '#2C2C2E' : '#F2F2F7') : color + '15' }]}>
        <Ionicons name={icon} size={20} color={disabled ? '#8E8E93' : color} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: colors.text }, disabled && { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.optionSub, { color: colors.textSecondary }, disabled && { color: isDark ? '#48484A' : '#D1D1D6' }]}>{subtitle}</Text>
      </View>
      <CustomToggle value={value} onToggle={onToggle} disabled={disabled} isDark={isDark} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cabecera */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Notificaciones</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Controla qué avisos quieres recibir</Text>
        </View>

        {/* Master toggle */}
        <View style={[styles.masterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.masterLeft}>
            <View style={[styles.masterIcon, { backgroundColor: notificationsEnabled ? (isDark ? '#32D74B15' : '#34C75915') : (isDark ? '#2C2C2E' : '#F2F2F7') }]}>
              <Ionicons
                name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'}
                size={24}
                color={notificationsEnabled ? (isDark ? '#32D74B' : '#34C759') : '#8E8E93'}
              />
            </View>
            <View style={styles.masterTextBlock}>
              <Text style={[styles.masterTitle, { color: colors.text }]}>Permitir notificaciones</Text>
              <Text style={[styles.masterSub, { color: colors.textSecondary }]}>
                {notificationsEnabled ? 'Las alertas están activas' : 'No recibirás ningún aviso'}
              </Text>
            </View>
          </View>
          <CustomToggle value={notificationsEnabled} onToggle={() => setNotificationsEnabled(v => !v)} isDark={isDark} />
        </View>

        {/* Alertas de Viaje */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }, disabled && { color: isDark ? '#48484A' : '#D1D1D6' }]}>Alertas de Viaje</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <NotificationOption
              icon="mail-unread-outline"
              title="Invitaciones"
              subtitle="Cuando te inviten a un viaje"
              color="#007AFF"
              value={tripInvites}
              onToggle={() => setTripInvites(v => !v)}
            />
            <View style={[styles.sep, { backgroundColor: colors.separator }]} />
            <NotificationOption
              icon="alarm-outline"
              title="Recordatorios"
              subtitle="Avisos antes de cada viaje"
              color="#FF9500"
              value={reminders}
              onToggle={() => setReminders(v => !v)}
            />
          </View>
        </View>

        {/* Social y Gastos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }, disabled && { color: isDark ? '#48484A' : '#D1D1D6' }]}>Social y Gastos</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <NotificationOption
              icon="chatbubbles-outline"
              title="Mensajes"
              subtitle="Nuevos mensajes en el grupo"
              color="#32ADE6"
              value={messages}
              onToggle={() => setMessages(v => !v)}
            />
            <View style={[styles.sep, { backgroundColor: colors.separator }]} />
            <NotificationOption
              icon="wallet-outline"
              title="Gastos"
              subtitle="Cuando se añada un gasto al bote"
              color="#5856D6"
              value={expenses}
              onToggle={() => setExpenses(v => !v)}
            />
          </View>
        </View>

        {disabled && (
          <View style={[styles.infoBar, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.infoBarText, { color: colors.textSecondary }]}>
              Activa las notificaciones para poder configurar las opciones.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Estilos ──
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  backButton: { marginBottom: 20, width: 40, height: 40, justifyContent: 'center' },
  headerSection: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },

  // Master
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
  },
  masterLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  masterIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  masterTextBlock: { flex: 1 },
  masterTitle: { fontSize: 16, fontWeight: 'bold' },
  masterSub: { fontSize: 13, marginTop: 2 },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, marginLeft: 8 },
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  sep: { height: 1, marginLeft: 68 },

  // Option row
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  optionDisabled: { opacity: 0.5 },
  iconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  optionText: { flex: 1, paddingRight: 8 },
  optionTitle: { fontSize: 16, fontWeight: '500' },
  optionSub: { fontSize: 13, marginTop: 2 },

  // Custom toggle
  toggleTouchable: { padding: 4 },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },

  // Info
  infoBar: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  infoBarText: { flex: 1, fontSize: 14, lineHeight: 20 },
});

export default NotificationsScreen;
