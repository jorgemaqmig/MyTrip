import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { tripService, Trip } from '../services/tripService';

const MyTripsScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' o 'past'
  const { user } = useAuth();
  const { setActiveTrip } = useTrip();
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
      : (item.startDate || 'Sin fechas');
      
    return (
      <TouchableOpacity 
        style={styles.tripCard}
        onPress={() => {
          setActiveTrip(item);
          navigation.navigate('MainTabs');
        }}
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
            <Text style={styles.tripTitle}>{item.name}</Text>
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
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={activeTab === 'upcoming' ? upcomingTrips : pastTrips}
        renderItem={renderTripCard}
        keyExtractor={(item) => (item.id as string) || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.topActions}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateTrip')}>
                <Ionicons name="add-circle" size={32} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Mis Viajes</Text>
              <Text style={styles.subtitle}>Gestiona tus aventuras planeadas y pasadas</Text>
            </View>

            <View style={styles.tabContainer}>
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

            {loading && (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
            )}
          </View>
        }
        ListEmptyComponent={!loading ? (
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
        ) : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 24,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
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
    borderWidth: 1,
    borderColor: '#F2F2F7',
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
    marginTop: 60,
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
