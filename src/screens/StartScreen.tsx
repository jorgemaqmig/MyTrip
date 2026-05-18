import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Animated,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { tripService, Trip } from '../services/tripService';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // Ajustado para el padding de 16

const ICON_COLORS = {
  create:  '#FF6B35',
  join:    '#6C5CE7',
  social:  '#00B894',
  trips:   '#0984E3',
};

const StartScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
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
          style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTrip(currentTrip);
            navigation.navigate('MainTabs');
          }}
        >
          {currentTrip.image && (
            <Image 
              source={{ uri: currentTrip.image }} 
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} 
            />
          )}
          {currentTrip.image && (
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
          )}
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.heroTop}>
              <View style={[styles.heroIconWrap, { backgroundColor: currentTrip.image ? 'rgba(255,255,255,0.2)' : ICON_COLORS.trips + '15' }]}>
                <Ionicons name="airplane" size={20} color={currentTrip.image ? '#fff' : ICON_COLORS.trips} />
              </View>
              <View style={styles.heroMeta}>
                <View style={[styles.heroPill, { backgroundColor: currentTrip.image ? 'rgba(255,255,255,0.2)' : (isDark ? '#2C2C2E' : '#F0F0F0') }]}>
                  <Text style={[styles.heroPillText, { color: currentTrip.image ? '#fff' : colors.textSecondary }]}>{currentTrip.status}</Text>
                </View>
                {trips.length > 1 && (
                  <Text style={[styles.heroCounter, { color: currentTrip.image ? '#fff' : colors.textSecondary }]}>{currentTripIndex + 1}/{trips.length}</Text>
                )}
              </View>
            </View>

            <Text style={[styles.heroTitle, { color: currentTrip.image ? '#fff' : colors.text }]} numberOfLines={1}>{currentTrip.name}</Text>
            
            <View style={styles.heroDetails}>
              <View style={styles.heroDetailItem}>
                <Ionicons name="location-outline" size={13} color={currentTrip.image ? 'rgba(255,255,255,0.8)' : colors.textSecondary} />
                <Text style={[styles.heroDetailText, { color: currentTrip.image ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]} numberOfLines={1}>{currentTrip.location}</Text>
              </View>
              <View style={styles.heroDetailItem}>
                <Ionicons name="calendar-outline" size={13} color={currentTrip.image ? 'rgba(255,255,255,0.8)' : colors.textSecondary} />
                <Text style={[styles.heroDetailText, { color: currentTrip.image ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
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
                      { backgroundColor: currentTrip.image ? 'rgba(255,255,255,0.3)' : (isDark ? '#3A3A3C' : '#DDD') },
                      i === currentTripIndex && [styles.dotActive, { backgroundColor: currentTrip.image ? '#fff' : ICON_COLORS.trips }],
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
      <View style={{ gap: 16 }}>
        {/* Card de Crear Viaje (Doble Ancho) */}
        <TouchableOpacity
          style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 0 }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CreateTrip')}
        >
          <View style={styles.heroTop}>
            <View style={[styles.heroIconWrap, { backgroundColor: ICON_COLORS.create + '15' }]}>
              <Ionicons name="add" size={20} color={ICON_COLORS.create} />
            </View>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Crear un viaje</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Planifica tu próxima aventura</Text>
        </TouchableOpacity>

        {/* Card de Unirse a un Viaje (Doble Ancho) */}
        <TouchableOpacity
          style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 0 }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('JoinTrip')}
        >
          <View style={styles.heroTop}>
            <View style={[styles.heroIconWrap, { backgroundColor: ICON_COLORS.join + '15' }]}>
              <Ionicons name="people-outline" size={20} color={ICON_COLORS.join} />
            </View>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Unirse a un viaje</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Introduce el código de tu grupo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Top Bar with Settings */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Logo Section */}
        <View style={styles.brandSection}>
          <View style={[styles.logoIcon, { backgroundColor: isDark ? colors.card : '#1A1A1A' }]}>
            <Ionicons name="airplane" size={32} color="#fff" />
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>My<Text style={styles.brandNameBold}>Trip</Text></Text>
        </View>

        {/* Hero / CTA Section */}
        <View style={{ marginBottom: 16 }}>
          {renderHero()}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {trips.length > 0 ? (
            <>
              <TouchableOpacity 
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('CreateTrip')}
              >
                <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.create + '15' }]}>
                  <Ionicons name="add-circle-outline" size={22} color={ICON_COLORS.create} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Crear Viaje</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Nueva aventura</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('JoinTrip')}
              >
                <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.join + '15' }]}>
                  <Ionicons name="people-outline" size={22} color={ICON_COLORS.join} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Unirse</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Código de viaje</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('Social')}
              >
                <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.social + '15' }]}>
                  <Ionicons name="chatbubble-outline" size={22} color={ICON_COLORS.social} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Social</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Amigos</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('MyTrips')}
              >
                <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.trips + '15' }]}>
                  <Ionicons name="map-outline" size={22} color={ICON_COLORS.trips} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Mis Viajes</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  {`${trips.length} ${trips.length === 1 ? 'viaje' : 'viajes'}`}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('Social')}
              >
                <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.social + '15' }]}>
                  <Ionicons name="chatbubble-outline" size={22} color={ICON_COLORS.social} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Social</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Amigos</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('MyTrips')}
              >
                <View style={[styles.cardIcon, { backgroundColor: ICON_COLORS.trips + '15' }]}>
                  <Ionicons name="map-outline" size={22} color={ICON_COLORS.trips} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Mis Viajes</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Tus aventuras</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '400',
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // Hero
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  heroCounter: {
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
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
  },
  dotActive: {
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
    borderRadius: 16,
    padding: 18,
    minHeight: CARD_WIDTH * 0.8,
    justifyContent: 'flex-end',
    borderWidth: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
});

export default StartScreen;
