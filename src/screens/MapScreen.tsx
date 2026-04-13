import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';

const MapScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip } = useTrip();

  // Si el viaje no tiene coordenadas exactas (creados antes del update), usar Madrid por defecto.
  const initialRegion = {
    latitude: activeTrip?.latitude || 40.4168,
    longitude: activeTrip?.longitude || -3.7038,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {activeTrip?.latitude && activeTrip?.longitude && (
          <Marker
            coordinate={{
              latitude: activeTrip.latitude,
              longitude: activeTrip.longitude
            }}
            title={activeTrip.location}
            description="Destino del viaje"
          />
        )}
      </MapView>

      <View style={styles.overlay}>
        <Text style={styles.title}>{activeTrip?.name || 'Mapa de Viaje'}</Text>
        <Text style={styles.subtitle}>{activeTrip?.location || 'Destino'}</Text>
      </View>

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
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 10,
    borderRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  },
});

export default MapScreen;
