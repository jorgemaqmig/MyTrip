import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SQUARE_SIZE = (width - 60) / 2;

const StartScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={28} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#007AFF', '#00C6FF']}
            style={styles.logoCircle}
          >
            <Ionicons name="airplane" size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.logoText}>MyTrip</Text>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity 
            style={[styles.squareAction, { backgroundColor: '#F2F2F7' }]} 
            onPress={() => navigation.navigate('CreateTrip')}
          >
            <Ionicons name="add-circle" size={32} color="#007AFF" />
            <Text style={styles.squareTitle}>Crear Viaje</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.squareAction, { backgroundColor: '#F2F2F7' }]} 
            onPress={() => navigation.navigate('JoinTrip')}
          >
            <Ionicons name="people" size={32} color="#5856D6" />
            <Text style={styles.squareTitle}>Unirse a Viaje</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.wideAction} onPress={() => {}}>
          <LinearGradient
            colors={['#5856D6', '#8E8DFF']}
            style={styles.wideGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.wideContent}>
              <Ionicons name="chatbubbles-outline" size={28} color="#fff" />
              <Text style={styles.wideTitle}>Social</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.wideAction} onPress={() => {}}>
          <View style={[styles.wideGradient, { backgroundColor: '#1C1C1E' }]}>
            <View style={styles.wideContent}>
              <Ionicons name="journal-outline" size={28} color="#fff" />
              <Text style={styles.wideTitle}>Mis Viajes</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>"El mundo es un libro y aquellos que no viajan solo leen una página."</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: 1,
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  squareAction: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  squareTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  wideAction: {
    width: '100%',
    height: SQUARE_SIZE * 0.8,
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  wideGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
  },
  wideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  wideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#FF3B30',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default StartScreen;
