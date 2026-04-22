import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { tripService, TripPoint } from '../services/tripService';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const MapScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip } = useTrip();
  
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  // Initial region centered on the trip destination
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
    
    // Parse considering timezone offsets correctly or simple split
    const startParts = activeTrip.startDate.split('-');
    const endParts = activeTrip.endDate.split('-');
    
    const startD = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    const endD = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
    
    const days = [];
    let currentD = new Date(startD);
    let dayIndex = 1;

    while (currentD <= endD) {
      // Use localized format for display
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      const dateString = `${currentD.getDate()} ${months[currentD.getMonth()]}`;
      
      days.push({
        index: dayIndex,
        dateString: dateString
      });
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
  };

  const handleAddPoint = async (dayIndex: number) => {
    if (!activeTrip?.id || !selectedPlace) return;
    
    // Default colors for different days
    const colors = ['#FF6B35', '#6C5CE7', '#00B894', '#0984E3', '#E84393', '#FDCB6E', '#00CEC9'];
    const color = dayIndex === 0 ? '#333333' : colors[(dayIndex - 1) % colors.length];

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
      fetchPoints(); // Refresh pins
      Alert.alert('Éxito', 'Punto añadido al itinerario');
    } catch (error) {
      Alert.alert('Error', 'No se pudo añadir el punto');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {/* Marcadores de los Puntos de Interés */}
        {points.map((point) => (
          <Marker
            key={point.id}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude
            }}
            title={point.name}
            description={point.dayIndex > 0 ? `Día ${point.dayIndex}` : 'Sin asignar'}
            pinColor={point.color}
          />
        ))}
      </MapView>

      {/* Barra de Búsqueda Flotante */}
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Buscar sitios para visitar..."
          onPress={handlePlaceSelect}
          fetchDetails={true}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'es',
            // Optional: You could bias results using the activeTrip's location radius
            location: `${activeTrip?.latitude},${activeTrip?.longitude}`,
            radius: 50000, // 50km
          }}
          styles={{
            container: styles.autocompleteContainer,
            textInput: styles.searchInput,
            listView: styles.listView,
          }}
          enablePoweredByContainer={false}
          textInputProps={{
            placeholderTextColor: '#999',
          }}
        />
      </View>

      {/* Modal para seleccionar el día */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir punto</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.placeName}>{selectedPlace?.name}</Text>
            <Text style={styles.placeAddress}>{selectedPlace?.locationName}</Text>
            
            <Text style={styles.questionText}>¿A qué día quieres añadirlo?</Text>
            
            <ScrollView style={styles.daysList}>
              {/* Opción para Sin Asignar */}
              <TouchableOpacity 
                style={styles.dayOption}
                onPress={() => handleAddPoint(0)}
              >
                <View style={styles.dayIconGroup}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dayOptionText}>Sin asignar / Decide luego</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CCC" />
              </TouchableOpacity>

              {/* Días del viaje */}
              {tripDays.map((day) => (
                <TouchableOpacity 
                  key={day.index}
                  style={styles.dayOption}
                  onPress={() => handleAddPoint(day.index)}
                >
                  <View style={styles.dayIconGroup}>
                    <Ionicons name="flag-outline" size={20} color="#0984E3" />
                    <View>
                      <Text style={styles.dayTitle}>Día {day.index}</Text>
                      <Text style={styles.dayDate}>{day.dateString}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Botón para volver al inicio */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('Start')}
      >
        <Ionicons name="chevron-back" size={28} color="#1C1C1E" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 80, // Dejamos espacio para el botón de volver
    zIndex: 1,
  },
  autocompleteContainer: {
    flex: 1,
  },
  searchInput: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    fontSize: 15,
  },
  listView: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0984E3',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  daysList: {
    maxHeight: 400,
  },
  dayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  dayIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dayDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});

export default MapScreen;
