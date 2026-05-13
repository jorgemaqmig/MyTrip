import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { tripService, TripPoint } from '../services/tripService';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Estilo de mapa oscuro para Google Maps
const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

const MapScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip } = useTrip();
  const { colors, isDark } = useTheme();
  
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const googlePlacesRef = useRef<any>(null);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const initialRegion = {
    latitude: activeTrip?.latitude || 40.4168,
    longitude: activeTrip?.longitude || -3.7038,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  const fetchPoints = async () => {
    if (!activeTrip?.id) return;
    try {
      const p = await tripService.getTripPoints(activeTrip.id);
      setPoints(p);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPoints();
    }, [activeTrip?.id])
  );

  const getTripDays = () => {
    if (!activeTrip?.startDate || !activeTrip?.endDate) return [];
    const startParts = activeTrip.startDate.split('-');
    const endParts = activeTrip.endDate.split('-');
    const startD = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    const endD = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
    const days = [];
    let currentD = new Date(startD);
    let dayIndex = 1;
    while (currentD <= endD) {
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      const dateString = `${currentD.getDate()} ${months[currentD.getMonth()]}`;
      days.push({ index: dayIndex, dateString: dateString });
      currentD.setDate(currentD.getDate() + 1);
      dayIndex++;
    }
    return days;
  };

  const tripDays = getTripDays();

  const handlePlaceSelect = (data: any, details: any = null) => {
    if (!details) return;
    setSelectedPlace({
      name: details.name || data.structured_formatting?.main_text,
      locationName: details.formatted_address || data.description,
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
    });
    setModalVisible(true);
    
    // Limpiamos el texto del buscador de forma segura
    if (googlePlacesRef.current) {
      googlePlacesRef.current.setAddressText('');
    }
  };

  const handleAddPoint = async (dayIndex: number) => {
    if (!activeTrip?.id || !selectedPlace) return;
    const dayColors = ['#FF6B35', '#6C5CE7', '#00B894', '#0984E3', '#E84393', '#FDCB6E', '#00CEC9'];
    const color = dayIndex === 0 ? '#333333' : dayColors[(dayIndex - 1) % dayColors.length];
    try {
      await tripService.addPointToTrip(activeTrip.id, {
        name: selectedPlace.name,
        locationName: selectedPlace.locationName,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        dayIndex: dayIndex,
        order: points.filter(p => p.dayIndex === dayIndex).length + 1,
        color: color
      });
      setModalVisible(false);
      setSelectedPlace(null);
      fetchPoints();
      setShowSuccess(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudo añadir el punto');
    }
  };

  // Memorizamos la query para que el buscador no se reinicie en cada render
  const googleQuery = React.useMemo(() => ({
    key: GOOGLE_MAPS_API_KEY,
    language: 'es',
    location: `${activeTrip?.latitude},${activeTrip?.longitude}`,
    radius: 50000,
  }), [activeTrip?.latitude, activeTrip?.longitude]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Toast de Éxito Personalizado */}
      {showSuccess && (
        <View style={styles.successToastContainer}>
          <View style={[styles.successToast, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: colors.border }]}>
            <View style={[styles.successIconCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={16} color="#FFF" />
            </View>
            <Text style={[styles.successText, { color: colors.text }]}>Lugar añadido con éxito</Text>
          </View>
        </View>
      )}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={isDark ? darkMapStyle : []}
      >
        {points.map((point) => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            title={point.name}
            description={point.dayIndex > 0 ? `Día ${point.dayIndex}` : 'Sin asignar'}
            pinColor={point.color}
          />
        ))}
      </MapView>

      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          ref={googlePlacesRef}
          placeholder="Buscar sitios para visitar..."
          onPress={handlePlaceSelect}
          fetchDetails={true}
          minLength={2}
          debounce={400}
          query={googleQuery}
          styles={{
            container: styles.autocompleteContainer,
            textInput: [styles.searchInput, { backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)', color: colors.text }],
            listView: [styles.listView, { backgroundColor: isDark ? '#1C1C1E' : '#fff' }],
            row: { backgroundColor: 'transparent', padding: 13, height: 44, flexDirection: 'row' },
            separator: { height: 1, backgroundColor: colors.separator },
            description: { color: colors.text },
          }}
          enablePoweredByContainer={false}
          suppressDefaultStyles={false}
          textInputProps={{ 
            placeholderTextColor: colors.textSecondary,
            clearButtonMode: 'while-editing'
          }}
        />
      </View>

      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} 
        onPress={() => navigation.navigate('Start')}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Añadir punto</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.placeName, { color: colors.primary }]}>{selectedPlace?.name}</Text>
            <Text style={[styles.placeAddress, { color: colors.textSecondary }]}>{selectedPlace?.locationName}</Text>
            
            <Text style={[styles.questionText, { color: colors.text }]}>¿A qué día quieres añadirlo?</Text>
            
            <ScrollView style={styles.daysList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={[styles.dayOption, { borderBottomColor: colors.separator }]} onPress={() => handleAddPoint(0)}>
                <View style={styles.dayIconGroup}>
                  <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.dayOptionText, { color: colors.text }]}>Sin asignar / Decide luego</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#48484A' : '#CCC'} />
              </TouchableOpacity>

              {tripDays.map((day) => (
                <TouchableOpacity key={day.index} style={[styles.dayOption, { borderBottomColor: colors.separator }]} onPress={() => handleAddPoint(day.index)}>
                  <View style={styles.dayIconGroup}>
                    <Ionicons name="flag-outline" size={20} color={colors.primary} />
                    <View>
                      <Text style={[styles.dayTitleText, { color: colors.text }]}>Día {day.index}</Text>
                      <Text style={[styles.dayDateText, { color: colors.textSecondary }]}>{day.dateString}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={isDark ? '#48484A' : '#CCC'} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  searchContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, right: 80, zIndex: 1 },
  autocompleteContainer: { flex: 1 },
  searchInput: { height: 44, borderRadius: 22, paddingHorizontal: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, fontSize: 15 },
  listView: { borderRadius: 12, marginTop: 8, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, zIndex: 2 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  placeName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  placeAddress: { fontSize: 14, marginBottom: 20 },
  questionText: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  daysList: { maxHeight: 400 },
  dayOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
  dayIconGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayOptionText: { fontSize: 16, fontWeight: '500' },
  dayTitleText: { fontSize: 16, fontWeight: '600' },
  dayDateText: { fontSize: 13, marginTop: 2 },
  successToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    gap: 10,
  },
  successIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MapScreen;
