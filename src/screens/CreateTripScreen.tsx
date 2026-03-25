import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const CreateTripScreen = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [numPeople, setNumPeople] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        searchLocation(query);
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const searchLocation = async (text: string) => {
    setLoading(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=5`);
      const data = await resp.json();
      setSuggestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
  if (startDate) markedDates[startDate] = { selected: true, startingDay: true, color: '#007AFF' };
  if (endDate) markedDates[endDate] = { selected: true, endingDay: true, color: '#007AFF' };

  const isFormValid = name && query && startDate && endDate;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flexOne}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Nuevo Viaje</Text>
            <Text style={styles.subtitle}>Configura tu próxima aventura en segundos</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Viaje</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Graduación 2026"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lugar</Text>
              <View style={styles.inputIconContainer}>
                <Ionicons name="location-outline" size={20} color="#007AFF" style={styles.icon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="¿A dónde vamos?"
                  value={query}
                  onChangeText={setQuery}
                />
                {loading ? <ActivityIndicator style={styles.loader} size="small" color="#007AFF" /> : null}
              </View>
              
              {suggestions.length > 0 ? (
                <View style={styles.suggestionsContainer}>
                  {suggestions.map((item, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.suggestionItem}
                      onPress={() => {
                        setLocation(item.display_name);
                        setQuery(item.display_name);
                        setSuggestions([]);
                      }}
                    >
                      <Ionicons name="pin-outline" size={16} color="#8E8E93" />
                      <Text style={styles.suggestionText} numberOfLines={1}>{item.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.dateContainer}>
              <TouchableOpacity style={styles.datePicker} onPress={() => { setShowCalendar(true); setSelectingStartDate(true); }}>
                <Text style={styles.label}>Fecha Inicio</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={18} color="#007AFF" />
                  <Text style={[styles.dateValue, !startDate ? { color: '#8E8E93' } : null]}>
                    {startDate || 'Día inicial'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.datePicker} onPress={() => { setShowCalendar(true); setSelectingStartDate(false); }}>
                <Text style={styles.label}>Fecha Fin</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={18} color="#007AFF" />
                  <Text style={[styles.dateValue, !endDate ? { color: '#8E8E93' } : null]}>
                    {endDate || 'Día final'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿Cuántas personas van?</Text>
              <View style={styles.peopleSelector}>
                <TouchableOpacity style={styles.counterButton} onPress={() => setNumPeople(Math.max(1, numPeople - 1))}>
                  <Ionicons name="remove" size={24} color="#007AFF" />
                </TouchableOpacity>
                <View style={styles.peopleCount}>
                  <Text style={styles.peopleCountText}>{numPeople}</Text>
                  <Text style={styles.peopleLabel}>{numPeople === 1 ? 'Persona' : 'Personas'}</Text>
                </View>
                <TouchableOpacity style={styles.counterButton} onPress={() => setNumPeople(Math.min(20, numPeople + 1))}>
                  <Ionicons name="add" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={() => navigation.navigate('MainTabs')}
              disabled={!isFormValid}
            >
              <LinearGradient
                colors={!isFormValid ? ['#E5E5EA', '#D1D1D6'] : ['#007AFF', '#00C6FF']}
                style={styles.gradientButton}
              >
                <Text style={styles.createButtonText}>Crear Viaje</Text>
                <Ionicons name="airplane-outline" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectingStartDate ? 'Selecciona fecha de inicio' : 'Selecciona fecha de fin'}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close-circle" size={28} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                selectedDayBackgroundColor: '#007AFF',
                todayTextColor: '#007AFF',
                arrowColor: '#007AFF',
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flexOne: { flex: 1 },
  scrollContent: { padding: 24 },
  backButton: { marginBottom: 20, width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E8E93' },
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#3A3A3C' },
  input: { backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, fontSize: 16, color: '#1C1C1E' },
  inputIconContainer: { position: 'relative', justifyContent: 'center' },
  inputWithIcon: { paddingLeft: 40 },
  icon: { position: 'absolute', left: 12, zIndex: 1 },
  loader: { position: 'absolute', right: 12 },
  suggestionsContainer: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F2F2F7',
    marginTop: 4, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  suggestionText: { fontSize: 14, color: '#1C1C1E', flex: 1 },
  dateContainer: { flexDirection: 'row', gap: 16 },
  datePicker: { flex: 1, backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, gap: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateValue: { fontSize: 15, color: '#1C1C1E', fontWeight: '500' },
  peopleSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F2F2F7', padding: 12, borderRadius: 16 },
  counterButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  peopleCount: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  peopleCountText: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  peopleLabel: { fontSize: 16, color: '#8E8E93', fontWeight: '500' },
  footer: { marginTop: 48, marginBottom: 40 },
  createButton: { borderRadius: 16, overflow: 'hidden' },
  gradientButton: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  calendarModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
});

export default CreateTripScreen;
