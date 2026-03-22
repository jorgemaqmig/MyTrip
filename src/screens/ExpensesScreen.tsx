import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ExpensesScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestor de Gastos</Text>
      <Text style={styles.subtitle}>Próximamente: Gráficos y multidivisa</Text>

      {/* Botón para volver al inicio */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('Start')}
      >
        <Ionicons name="home-outline" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>Inicio</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButtonText: {
    marginLeft: 5,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default ExpensesScreen;
