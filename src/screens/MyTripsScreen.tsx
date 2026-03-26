import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { tripService, Trip } from '../services/tripService';
import { useCallback } from 'react';

const { width } = Dimensions.get('window');

const MyTripsScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' o 'past'
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userTrips = await tripService.getUserTrips(user.uid);
      setTrips(userTrips);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [user])
  );

  const today = new Date().toISOString().split('T')[0];
  const upcomingTrips = trips.filter(t => t.endDate >= today);
  const pastTrips = trips.filter(t => t.endDate < today);

  const getTripColor = (index: number) => {
    const colors = [
      ['#007AFF', '#00C6FF'],
      ['#5856D6', '#8E8DFF'],
      ['#FF9500', '#FFCC00'],
      ['#FF3B30', '#FF7A7A'],
      ['#34C759', '#53E079']
    ] as const;
    return colors[index % colors.length] as readonly [string, string, ...string[]];
  };

  const renderTripCard = ({ item, index }: any) => {
    const color = getTripColor(index);
    const dateStr = item.startDate && item.endDate 
      ? `${item.startDate.slice(5)} - ${item.endDate.slice(5)}` 
      : (item.startDate || item.dates);
      
    return (
      <TouchableOpacity 
        style={styles.tripCard}
        onPress={() => navigation.navigate('MainTabs')}
      >
        <LinearGradient
          colors={color}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardHeader}
        >
          <Ionicons name="airplane" size={30} color="#fff" />
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.cardBody}>
          <View style={styles.mainInfo}>
            <Text style={styles.tripTitle}>{item.title || item.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#8E8E93" />
              <Text style={styles.tripLocation}>{item.location}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="calendar-outline" size={16} color="#007AFF" />
              <Text style={styles.footerLabel}>{dateStr}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="people-outline" size={16} color="#007AFF" />
              <Text style={styles.footerLabel}>{item.numPeople || item.participants} per.</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera Personalizada */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Viajes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateTrip')}>
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Selector de Pestañas */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Próximos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Anteriores</Text>
        </TouchableOpacity>
      </View>

      {/* Listado de Viajes */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'upcoming' ? upcomingTrips : pastTrips}
          renderItem={renderTripCard}
          keyExtractor={(item) => (item.id as string) || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="trail-sign-outline" size={80} color="#D1D1D6" />
              <Text style={styles.emptyText}>No hay viajes en esta sección</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('CreateTrip')}
              >
                <Text style={styles.emptyButtonText}>Crear mi primer viaje</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    height: 100,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 20,
  },
  mainInfo: {
    marginBottom: 15,
  },
  tripTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripLocation: {
    fontSize: 14,
    color: '#8E8E93',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLabel: {
    fontSize: 13,
    color: '#3A3A3C',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 20,
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyTripsScreen;
