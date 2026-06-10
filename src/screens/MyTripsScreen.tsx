import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { tripService, Trip } from '../services/tripService';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

// ── Pantalla Mis Viajes ──
const MyTripsScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('upcoming'); 
  const { user } = useAuth();
  const { setActiveTrip } = useTrip();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar los viajes del usuario
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
    const tripColors = [
      ['#007AFF', '#00C6FF'],
      ['#5856D6', '#8E8DFF'],
      ['#FF9500', '#FFCC00'],
      ['#FF3B30', '#FF7A7A'],
      ['#34C759', '#53E079']
    ] as const;
    return tripColors[index % tripColors.length] as readonly [string, string, ...string[]];
  };

  // Función para renderizar cada tarjeta de viaje
  const renderTripCard = ({ item, index }: any) => {
    const color = getTripColor(index);
    const dateStr = item.startDate && item.endDate 
      ? `${item.startDate.slice(5)} - ${item.endDate.slice(5)}` 
      : (item.startDate || 'Sin fechas');
      
    return (
      <TouchableOpacity 
        style={[styles.tripCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          setActiveTrip(item);
          navigation.navigate('MainTabs');
        }}
      >
        <View style={styles.cardHeaderContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.headerImage} />
          ) : (
            <LinearGradient
              colors={color}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']}
            style={[StyleSheet.absoluteFill, styles.headerOverlay]}
          >
            <View style={styles.headerContent}>
              <Ionicons name="airplane" size={30} color="#fff" />
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.mainInfo}>
            <Text style={[styles.tripTitle, { color: colors.text }]}>{item.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.textSecondary} />
              <Text style={[styles.tripLocation, { color: colors.textSecondary }]}>{item.location}</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          
          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={[styles.footerLabel, { color: colors.text }]}>{dateStr}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizado principal
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
                <Ionicons name="chevron-back" size={28} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateTrip')}>
                <Ionicons name="add-circle" size={32} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Mis Viajes</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gestiona tus aventuras planeadas y pasadas</Text>
            </View>

            <View style={[styles.tabContainer, { borderBottomColor: colors.separator }]}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'upcoming' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
                onPress={() => setActiveTab('upcoming')}
              >
                <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'upcoming' && { color: colors.primary }]}>Próximos</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'past' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
                onPress={() => setActiveTab('past')}
              >
                <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'past' && { color: colors.primary }]}>Anteriores</Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            )}
          </View>
        }
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trail-sign-outline" size={80} color={isDark ? '#3A3A3C' : '#D1D1D6'} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay viajes en esta sección</Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
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

// Estilos de la pantalla de Mis viajes
const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 24 },
  topActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  addButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  tabContainer: { flexDirection: 'row', marginBottom: 24, borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3 },
  tabText: { fontSize: 15, fontWeight: '600' },
  tripCard: { borderRadius: 24, marginBottom: 20, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1 },
  cardHeaderContainer: { height: 120, position: 'relative' },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  headerOverlay: { padding: 20, justifyContent: 'center' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardBody: { padding: 20 },
  mainInfo: { marginBottom: 15 },
  tripTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripLocation: { fontSize: 14 },
  divider: { height: 1, marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerLabel: { fontSize: 13, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, marginTop: 20, marginBottom: 30 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default MyTripsScreen;
