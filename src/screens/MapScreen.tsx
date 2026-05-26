import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { tripService, TripPoint } from '../services/tripService';
import { db } from '../services/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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

const PREMIUM_PALETTE = [
  '#3B82F6', // Royal Blue
  '#10B981', // Emerald Green
  '#FF6B35', // Orange Coral
  '#8B5CF6', // Purple Orchid
  '#EC4899', // Rose Pink
  '#06B6D4', // Sky Blue
  '#F59E0B', // Golden Honey
  '#EF4444', // Red Fire
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

  // Estados para editar un punto del mapa
  const [editPointModalVisible, setEditPointModalVisible] = useState(false);
  const [selectedPointToEdit, setSelectedPointToEdit] = useState<TripPoint | null>(null);

  const getDayColor = (dayIndex: number) => {
    if (dayIndex === 0) return '#8E8E93';
    const idxStr = dayIndex.toString();
    if (activeTrip?.dayColors && activeTrip.dayColors[idxStr]) {
      return activeTrip.dayColors[idxStr];
    }
    return PREMIUM_PALETTE[(dayIndex - 1) % PREMIUM_PALETTE.length] || '#3B82F6';
  };

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Listener en tiempo real de los puntos del itinerario en el mapa
  useEffect(() => {
    if (!activeTrip?.id) return;

    const pointsRef = collection(db, 'trips', activeTrip.id, 'points');
    const unsubscribe = onSnapshot(pointsRef, (snapshot) => {
      const pList: TripPoint[] = [];
      snapshot.forEach((docSnap) => {
        pList.push({ id: docSnap.id, ...docSnap.data() } as TripPoint);
      });
      pList.sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return a.order - b.order;
      });
      setPoints(pList);
    }, (error) => {
      console.error("Error listening to points in map: ", error);
    });

    return () => unsubscribe();
  }, [activeTrip?.id]);

  const initialRegion = {
    latitude: activeTrip?.latitude || 40.4168,
    longitude: activeTrip?.longitude || -3.7038,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  const handleEditPointPress = (point: TripPoint) => {
    setSelectedPointToEdit(point);
    setEditPointModalVisible(true);
  };

  const handleUpdatePointDay = async (newDayIndex: number) => {
    if (!activeTrip?.id || !selectedPointToEdit) return;
    try {
      const order = points.filter(p => p.dayIndex === newDayIndex).length + 1;
      const pointRef = doc(db, 'trips', activeTrip.id!, 'points', selectedPointToEdit.id!);
      await updateDoc(pointRef, {
        dayIndex: newDayIndex,
        order: order,
        color: getDayColor(newDayIndex)
      });
      setEditPointModalVisible(false);
      setSelectedPointToEdit(null);
    } catch (e) {
      Alert.alert('Error', 'No se pudo mover el punto');
    }
  };

  const handleDeletePoint = async () => {
    if (!activeTrip?.id || !selectedPointToEdit) return;
    Alert.alert('Eliminar', '¿Quitar sitio de tu itinerario?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            const pointRef = doc(db, 'trips', activeTrip.id!, 'points', selectedPointToEdit.id!);
            await deleteDoc(pointRef);
            setEditPointModalVisible(false);
            setSelectedPointToEdit(null);
          } catch (e) {
            Alert.alert('Error', 'No se pudo eliminar el punto');
          }
      }}
    ]);
  };

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
    const color = getDayColor(dayIndex);
    try {
      await tripService.addPointToTrip(activeTrip.id!, {
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
        {points.map((point) => {
          const markerColor = getDayColor(point.dayIndex);
          return (
            <Marker
              key={`${point.id}_${point.dayIndex}_${markerColor}`}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              onPress={(e) => {
                if (e && e.preventDefault) {
                  e.preventDefault();
                }
                handleEditPointPress(point);
              }}
              pinColor={markerColor}
            />
          );
        })}
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

      {/* Modal para Añadir Punto */}
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

      {/* Modal para Editar / Eliminar Punto Existente */}
      <Modal visible={editPointModalVisible} transparent={true} animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.editModalContent, { backgroundColor: colors.card }]}>
            {/* Drag Handle */}
            <View style={styles.editDragHandleContainer}>
              <View style={[styles.editDragHandle, { backgroundColor: isDark ? '#48484A' : '#D1D1D6' }]} />
            </View>

            {/* Header */}
            <View style={styles.editModalHeader}>
              <Text style={[styles.editModalTitle, { color: colors.text }]}>Editar parada</Text>
              <TouchableOpacity
                style={[styles.editCloseBtn, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
                onPress={() => setEditPointModalVisible(false)}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Place Info Card */}
            {selectedPointToEdit && (
              <View style={[
                styles.editPlaceCard,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#F9F9FB',
                  borderLeftColor: getDayColor(selectedPointToEdit.dayIndex),
                }
              ]}>
                <View style={[styles.editPlaceIconCircle, { backgroundColor: getDayColor(selectedPointToEdit.dayIndex) + '20' }]}>
                  <Ionicons name="location" size={22} color={getDayColor(selectedPointToEdit.dayIndex)} />
                </View>
                <View style={styles.editPlaceInfo}>
                  <Text style={[styles.editPlaceName, { color: colors.text }]} numberOfLines={1}>{selectedPointToEdit.name}</Text>
                  <Text style={[styles.editPlaceAddress, { color: colors.textSecondary }]} numberOfLines={2}>{selectedPointToEdit.locationName}</Text>
                </View>
              </View>
            )}

            {/* Section Label */}
            <Text style={[styles.editSectionLabel, { color: colors.textSecondary }]}>MOVER A OTRO DÍA</Text>

            {/* Day Selector List */}
            <ScrollView style={styles.editDaysList} showsVerticalScrollIndicator={false}>
              {/* Sin asignar option */}
              <TouchableOpacity
                style={[
                  styles.editDayRow,
                  {
                    backgroundColor: selectedPointToEdit?.dayIndex === 0
                      ? (isDark ? '#2C2C2E' : '#EEF2FF')
                      : (isDark ? '#1C1C1E' : '#FFFFFF'),
                    borderColor: selectedPointToEdit?.dayIndex === 0
                      ? (isDark ? '#48484A' : '#C7D2FE')
                      : (isDark ? '#2C2C2E' : '#E5E7EB'),
                  }
                ]}
                onPress={() => handleUpdatePointDay(0)}
              >
                <View style={styles.editDayRowLeft}>
                  <View style={[styles.editDayColorDot, { backgroundColor: '#8E8E93' }]} />
                  <Text style={[styles.editDayRowText, { color: colors.text }]}>Sin asignar</Text>
                </View>
                {selectedPointToEdit?.dayIndex === 0 && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>

              {tripDays.map((day) => {
                const isCurrentDay = selectedPointToEdit?.dayIndex === day.index;
                const dayColor = getDayColor(day.index);
                return (
                  <TouchableOpacity
                    key={day.index}
                    style={[
                      styles.editDayRow,
                      {
                        backgroundColor: isCurrentDay
                          ? (isDark ? '#2C2C2E' : dayColor + '10')
                          : (isDark ? '#1C1C1E' : '#FFFFFF'),
                        borderColor: isCurrentDay
                          ? dayColor + '60'
                          : (isDark ? '#2C2C2E' : '#E5E7EB'),
                      }
                    ]}
                    onPress={() => handleUpdatePointDay(day.index)}
                  >
                    <View style={styles.editDayRowLeft}>
                      <View style={[styles.editDayColorDot, { backgroundColor: dayColor }]} />
                      <View>
                        <Text style={[styles.editDayRowTitle, { color: colors.text }]}>Día {day.index}</Text>
                        <Text style={[styles.editDayRowDate, { color: colors.textSecondary }]}>{day.dateString}</Text>
                      </View>
                    </View>
                    {isCurrentDay && (
                      <Ionicons name="checkmark-circle" size={22} color={dayColor} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.editDeleteButton}
              onPress={handleDeletePoint}
            >
              <Ionicons name="trash-outline" size={18} color="#FF453A" />
              <Text style={styles.editDeleteText}>Eliminar de mi viaje</Text>
            </TouchableOpacity>
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
  // ──── Edit Modal Premium Styles ────
  editModalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '75%',
  },
  editDragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  editDragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  editCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPlaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    marginBottom: 20,
    gap: 12,
  },
  editPlaceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPlaceInfo: {
    flex: 1,
  },
  editPlaceName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  editPlaceAddress: {
    fontSize: 13,
    lineHeight: 17,
  },
  editSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  editDaysList: {
    maxHeight: 300,
  },
  editDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  editDayRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editDayColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  editDayRowText: {
    fontSize: 15,
    fontWeight: '500',
  },
  editDayRowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  editDayRowDate: {
    fontSize: 12,
    marginTop: 1,
  },
  editDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    marginTop: 16,
    gap: 8,
  },
  editDeleteText: {
    color: '#FF453A',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MapScreen;
