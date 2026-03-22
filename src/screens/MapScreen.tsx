import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MapScreen = () => {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 40.4168,
          longitude: -3.7038,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>Mapa de Viaje</Text>
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
