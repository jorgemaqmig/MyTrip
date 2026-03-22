import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const StartScreen = () => {
  const navigation = useNavigation<any>();

  const handleCreateTrip = () => {
    // Navigate to the creation form
    navigation.navigate('CreateTrip');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>¡Hola, Viajero!</Text>
          <Text style={styles.title}>Tus Aventuras</Text>
        </View>

        {/* Sección de Acciones Principales */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.mainAction} 
            onPress={handleCreateTrip}
          >
            <LinearGradient
              colors={['#007AFF', '#00C6FF']}
              style={styles.gradientCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add-circle-outline" size={40} color="#fff" />
              <Text style={styles.actionText}>Crear Nuevo Viaje</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={() => {}}>
            <Ionicons name="people-outline" size={32} color="#007AFF" />
            <Text style={styles.secondaryActionText}>Unirme a un Viaje</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de Amigos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Amigos</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsScroll}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.friendPlaceholder}>
                <View style={[styles.avatar, { backgroundColor: ['#FF9500', '#FF2D55', '#4CD964', '#5856D6', '#007AFF'][i % 5] }]}>
                  <Text style={styles.avatarText}>A{i}</Text>
                </View>
                <Text style={styles.friendName}>Amigo {i}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addFriend}>
              <View style={styles.addFriendInner}>
                <Ionicons name="person-add-outline" size={24} color="#666" />
              </View>
              <Text style={styles.friendName}>Añadir</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Viajes Recientes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tus Planes Guardados</Text>
          <View style={styles.emptyContainer}>
            <Ionicons name="airplane-outline" size={60} color="#E5E5EA" />
            <Text style={styles.emptyText}>Aún no tienes viajes creados.</Text>
            <TouchableOpacity style={styles.buttonEmpty} onPress={handleCreateTrip}>
              <Text style={styles.buttonEmptyText}>Empezar a planificar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  actionContainer: {
    marginBottom: 40,
    gap: 15,
  },
  mainAction: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientCard: {
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  secondaryAction: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  secondaryActionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  seeAll: {
    color: '#007AFF',
    fontWeight: '600',
  },
  friendsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  friendPlaceholder: {
    alignItems: 'center',
    marginRight: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 12,
    color: '#3C3C43',
  },
  addFriend: {
    alignItems: 'center',
    marginRight: 20,
  },
  addFriendInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyText: {
    marginTop: 10,
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonEmpty: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonEmptyText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default StartScreen;
