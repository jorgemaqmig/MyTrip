import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Modal,
  LogBox,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { tripService } from '../services/tripService';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

// Pantalla de creación de viaje
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const CreateTripScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { setActiveTrip } = useTrip();
  const placesRef = useRef<any>(null);
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [creating, setCreating] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);

  const handleCreateTrip = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear un viaje');
      return;
    }
    
    // Validación básica del formulario
    setCreating(true);
    try {
      const tripData = {
        userId: user.uid,
        name,
        location,
        latitude,
        longitude,
        startDate,
        endDate,
        status: 'Planeado' as const,
      };
      const tripId = await tripService.createTrip(tripData);
      
      setActiveTrip({
        id: tripId,
        createdAt: new Date(),
        ...tripData
      });

      navigation.navigate('MainTabs');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo crear el viaje');
    } finally {
      setCreating(false);
    }
  };

  // Maneja la selección de fechas en el calendario
  const handleDayPress = (day: any) => {
    if (selectingStartDate) {
      setStartDate(day.dateString);
      setSelectingStartDate(false);
    } else {
      setEndDate(day.dateString);
      setShowCalendar(false);
      setSelectingStartDate(true);
    }
  };

  const markedDates: any = {};
  if (startDate) markedDates[startDate] = { selected: true, startingDay: true, color: colors.primary };
  if (endDate) markedDates[endDate] = { selected: true, endingDay: true, color: colors.primary };

  const isFormValid = name && location && startDate && endDate;

  const headerComponent = (
    <View style={styles.scrollContent}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Nuevo Viaje</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Configura tu próxima aventura en segundos</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nombre del Viaje</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', color: colors.text }]}
            placeholder="Ej: Graduación 2026"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={[styles.inputGroup, { zIndex: 10 }]}>
          <Text style={[styles.label, { color: colors.text }]}>Lugar</Text>
          <GooglePlacesAutocomplete
            ref={placesRef}
            placeholder="¿A dónde vamos?"
            minLength={2}
            fetchDetails={true}
            onPress={(data, details = null) => {
              setLocation(data.description);
              if (details?.geometry?.location) {
                setLatitude(details.geometry.location.lat);
                setLongitude(details.geometry.location.lng);
              }
            }}
            query={{
              key: GOOGLE_MAPS_API_KEY,
              language: 'es',
            }}
            debounce={400}
            enablePoweredByContainer={false}
            styles={{
              textInputContainer: {
                backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                paddingRight: 10,
              },
              textInput: {
                height: 50,
                backgroundColor: 'transparent',
                color: colors.text,
                fontSize: 16,
                paddingHorizontal: 15,
                marginBottom: 0,
              },
              listView: {
                backgroundColor: isDark ? '#1C1C1E' : '#fff',
                borderRadius: 12,
                marginTop: 5,
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                zIndex: 1000,
                borderWidth: isDark ? 1 : 0,
                borderColor: colors.border,
              },
              row: {
                padding: 13,
                height: 50,
                flexDirection: 'row',
                backgroundColor: isDark ? '#1C1C1E' : '#fff',
              },
              separator: {
                height: 1,
                backgroundColor: colors.separator,
              },
              description: {
                color: colors.text,
              },
              poweredContainer: {
                backgroundColor: isDark ? '#1C1C1E' : '#fff',
              }
            }}
            textInputProps={{
              placeholderTextColor: colors.textSecondary,
              onChangeText: (text) => {
                if (text === '') {
                  setLocation('');
                  setLatitude(undefined);
                  setLongitude(undefined);
                }
              }
            }}
            renderRightButton={() => (
              location ? (
                <TouchableOpacity onPress={() => {
                  placesRef.current?.setAddressText('');
                  setLocation('');
                  setLatitude(undefined);
                  setLongitude(undefined);
                }}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null
            )}
          />
        </View>

        <View style={styles.dateContainer}>
          <TouchableOpacity 
            style={[styles.datePicker, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]} 
            onPress={() => { setShowCalendar(true); setSelectingStartDate(true); }}
          >
            <Text style={[styles.label, { color: colors.text }]}>Fecha Inicio</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={[styles.dateValue, { color: colors.text }, !startDate ? { color: colors.textSecondary } : null]}>
                {startDate || 'Día inicial'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.datePicker, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]} 
            onPress={() => { setShowCalendar(true); setSelectingStartDate(false); }}
          >
            <Text style={[styles.label, { color: colors.text }]}>Fecha Fin</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={[styles.dateValue, { color: colors.text }, !endDate ? { color: colors.textSecondary } : null]}>
                {endDate || 'Día final'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={handleCreateTrip}
          disabled={!isFormValid || creating}
        >
          <LinearGradient
            colors={(!isFormValid || creating) ? [colors.border, colors.border] : ['#007AFF', '#00C6FF']}
            style={styles.gradientButton}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.createButtonText}>Crear Viaje</Text>
                <Ionicons name="airplane-outline" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderiza la pantalla de creación de viaje
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flexOne}
      >
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={headerComponent}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </KeyboardAvoidingView>

      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.calendarModal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectingStartDate ? 'Selecciona fecha de inicio' : 'Selecciona fecha de fin'}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                backgroundColor: colors.card,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: isDark ? '#48484A' : '#d9e1e8',
                dotColor: colors.primary,
                selectedDotColor: '#ffffff',
                arrowColor: colors.primary,
                disabledArrowColor: colors.border,
                monthTextColor: colors.text,
                indicatorColor: colors.primary,
                textDayFontWeight: '400',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Estilos para la pantalla de creación de viaje
const styles = StyleSheet.create({
  container: { flex: 1 },
  flexOne: { flex: 1 },
  scrollContent: { padding: 24 },
  backButton: { marginBottom: 20, width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { padding: 16, borderRadius: 12, fontSize: 16 },
  dateContainer: { flexDirection: 'row', gap: 16 },
  datePicker: { flex: 1, padding: 16, borderRadius: 12, gap: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateValue: { fontSize: 15, fontWeight: '500' },
  footer: { marginTop: 48, marginBottom: 40 },
  createButton: { borderRadius: 16, overflow: 'hidden' },
  gradientButton: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  calendarModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
});

export default CreateTripScreen;
