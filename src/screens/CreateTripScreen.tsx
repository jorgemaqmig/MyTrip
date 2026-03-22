import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CreateTripScreen = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');

  const handleCreate = () => {
    // Para este prototipo, simplemente navegamos. 
    // En el futuro aquí guardaremos en SQLite o Firebase.
    navigation.navigate('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Nuevo Viaje</Text>
            <Text style={styles.subtitle}>Cuéntanos los detalles de tu próxima aventura</Text>
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
                <Ionicons name="location-outline" size={20} color="#8E8E93" style={styles.icon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 40 }]}
                  placeholder="Ej: Madrid, España"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <View style={styles.dateContainer}>
              <View style={styles.datePicker}>
                <Text style={styles.label}>Fecha Inicio</Text>
                <TextInput
                  style={styles.dateValue}
                  placeholder="DD/MM/AAAA"
                  value={startDateStr}
                  onChangeText={setStartDateStr}
                />
              </View>

              <View style={styles.datePicker}>
                <Text style={styles.label}>Fecha Fin</Text>
                <TextInput
                  style={styles.dateValue}
                  placeholder="DD/MM/AAAA"
                  value={endDateStr}
                  onChangeText={setEndDateStr}
                />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleCreate}
              disabled={!name || !location || !startDateStr || !endDateStr}
            >
              <LinearGradient
                colors={['#007AFF', '#00C6FF']}
                style={styles.gradientButton}
              >
                <Text style={styles.createButtonText}>Crear Viaje</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
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
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  input: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  inputIconContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  icon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  datePicker: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  dateValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  footer: {
    marginTop: 48,
    marginBottom: 40,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateTripScreen;
