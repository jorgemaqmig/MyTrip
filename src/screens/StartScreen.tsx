import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { tripService, Trip } from '../services/tripService';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

const ICON_COLORS = {
  create:  '#FF6B35',
  join:    '#6C5CE7',
  social:  '#00B894',
  trips:   '#0984E3',
};

const StartScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { setActiveTrip } = useTrip();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTripIndex, setCurrentTripIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (!user) return;
        try {
          const t = await tripService.getUserTrips(user.uid);
          setTrips(t);
          setCurrentTripIndex(0);
        } catch (e) {}
      };
      load();
    }, [user])
  );

  useEffect(() => {
    if (trips.length <= 1) return;
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentTripIndex(prev => (prev + 1) % trips.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [trips.length]);

  const currentTrip = trips[currentTripIndex];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
  };

  const renderHero = () => {
    if (trips.length > 0 && currentTrip) {
      return (
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTrip(currentTrip);
            navigation.navigate('MainTabs');
          }}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.heroTop}>
              <View style={[styles.heroIconWrap, { backgroundColor: ICON_COLORS.trips + '10' }]}>
                <Ionicons name="airplane" size={20} color={ICON_COLORS.trips} />
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroPill}>{currentTrip.status}</Text>
                {trips.length > 1 && (
                  <Text style={styles.heroCounter}>{currentTripIndex + 1}/{trips.length}</Text>
                )}
              </View>
            </View>

            <Text style={styles.heroTitle} numberOfLines={1}>{currentTrip.name}</Text>
            
            <View style={styles.heroDetails}>
              <View style={styles.heroDetailItem}>
                <Ionicons name="location-outline" size={13} color="#999" />
                <Text style={styles.heroDetailText} numberOfLines={1}>{currentTrip.location}</Text>
              </View>
              <View style={styles.heroDetailItem}>
                <Ionicons name="calendar-outline" size={13} color="#999" />
                <Text style={styles.heroDetailText}>
                  {formatDate(currentTrip.startDate)} — {formatDate(currentTrip.endDate)}
                </Text>
              </View>
            </View>

            {trips.length > 1 && (
              <View style={styles.dotsRow}>
                {trips.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === currentTripIndex && [styles.dotActive, { backgroundColor: ICON_COLORS.trips }],
                    ]}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.heroCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CreateTrip')}
      >
        <View style={styles.heroTop}>
          <View style={[styles.heroIconWrap, { backgroundColor: ICON_COLORS.create + '10' }]}>
            <Ionicons name="add" size={20} color={ICON_COLORS.create} />
          </View>
        </View>
        <Text style={styles.heroTitle}>Crea tu primer viaje</Text>
        <Text style={styles.heroSubtitle}>Planifica tu próxima aventura</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Settings */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.settingsBtn} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={22} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Logo Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoIcon}>
            <Ionicons name="airplane" size={32} color="#fff" />
          </View>
          <Text style={styles.brandName}>My<Text style={styles.brandNameBold}>Trip</Text></Text>
        </View>

        {/* Hero */}
        {renderHero()}

        {/* Grid */}
        <View style={styles.grid}>
          {trips.length > 0 ? (
            <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate('CreateTrip')}>
              <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.create + '10' }]}>
                <Ionicons name="add-circle-outline" size={22} color={ICON_COLORS.create} />
              </View>
              <Text style={styles.cardTitle}>Crear Viaje</Text>
              <Text style={styles.cardSub}>Nueva aventura</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate('MyTrips')}>
              <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.trips + '10' }]}>
                <Ionicons name="map-outline" size={22} color={ICON_COLORS.trips} />
              </View>
              <Text style={styles.cardTitle}>Mis Viajes</Text>
              <Text style={styles.cardSub}>Tus aventuras</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate('JoinTrip')}>
            <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.join + '10' }]}>
              <Ionicons name="people-outline" size={22} color={ICON_COLORS.join} />
            </View>
            <Text style={styles.cardTitle}>Unirse</Text>
            <Text style={styles.cardSub}>Código de viaje</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate('Social')}>
            <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.social + '10' }]}>
              <Ionicons name="chatbubble-outline" size={22} color={ICON_COLORS.social} />
            </View>
            <Text style={styles.cardTitle}>Social</Text>
            <Text style={styles.cardSub}>Amigos</Text>
          </TouchableOpacity>

          {trips.length > 0 ? (
            <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate('MyTrips')}>
              <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.trips + '10' }]}>
                <Ionicons name="map-outline" size={22} color={ICON_COLORS.trips} />
              </View>
              <Text style={styles.cardTitle}>Mis Viajes</Text>
              <Text style={styles.cardSub}>{trips.length} {trips.length === 1 ? 'viaje' : 'viajes'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate('CreateTrip')}>
              <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.create + '10' }]}>
                <Ionicons name="compass-outline" size={22} color={ICON_COLORS.create} />
              </View>
              <Text style={styles.cardTitle}>Explorar</Text>
              <Text style={styles.cardSub}>Descubre</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Brand / Logo
  brandSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '400',
    color: '#1A1A1A',
    letterSpacing: -1,
  },
  brandNameBold: {
    fontWeight: '800',
  },

  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },

  // Hero
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroPill: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  heroCounter: {
    fontSize: 11,
    color: '#BBB',
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  heroDetails: {
    gap: 5,
  },
  heroDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroDetailText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '400',
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDD',
  },
  dotActive: {
    backgroundColor: '#555',
    width: 14,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    minHeight: CARD_WIDTH * 0.8,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardSub: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
    fontWeight: '400',
  },
});

export default StartScreen;
