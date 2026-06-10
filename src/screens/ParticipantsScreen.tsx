import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { authService } from '../services/authService';
import { tripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

interface ParticipantData {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

// Pantalla de Participantes
const ParticipantsScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip, setActiveTrip } = useTrip();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserIsOrganizer = activeTrip?.organizers?.includes(user?.uid || '') || activeTrip?.userId === user?.uid;
  const currentUserIsCreator = user?.uid === activeTrip?.userId;

  // Cargamos los datos de los participantes al montar la pantalla
  useEffect(() => {
    const loadParticipants = async () => {
      if (!activeTrip?.participants) {
        setLoading(false);
        return;
      }

      try {
        const userDataPromises = activeTrip.participants.map(uid => authService.getUserData(uid));
        const userData = await Promise.all(userDataPromises);
        
        // Combinamos el UID con los datos de Firestore
        const participantsList = userData
          .map((data, index) => {
            if (!data) return null;
            return {
              uid: activeTrip.participants![index],
              displayName: data.displayName,
              email: data.email,
              photoURL: data.photoURL,
            } as ParticipantData;
          })
          .filter((p): p is ParticipantData => p !== null && Boolean(p.displayName));

        setParticipants(participantsList);
      } catch (error) {
        console.error("Error loading participants:", error);
      } finally {
        setLoading(false);
      }
    };

    loadParticipants();
  }, [activeTrip]);

  // Función para promover a un participante a organizador
  const handlePromote = async (targetUserId: string) => {
    if (!activeTrip?.id) return;
    
    try {
      await tripService.promoteToOrganizer(activeTrip.id, targetUserId);
      const updatedOrganizers = [...(activeTrip.organizers || [activeTrip.userId]), targetUserId];
      setActiveTrip({ ...activeTrip, organizers: updatedOrganizers });
    } catch (error) {
      console.error("Error promoting user:", error);
    }
  };

  // Función para degradar a un organizador a participante
  const handleDemote = async (targetUserId: string) => {
    if (!activeTrip?.id) return;
    
    try {
      await tripService.demoteOrganizer(activeTrip.id, targetUserId);
      const updatedOrganizers = (activeTrip.organizers || []).filter(id => id !== targetUserId);
      setActiveTrip({ ...activeTrip, organizers: updatedOrganizers });
    } catch (error) {
      console.error("Error demoting user:", error);
    }
  };

  // Función para renderizar cada participante
  const renderParticipant = ({ item }: { item: ParticipantData }) => {
    const isOrganizer = activeTrip?.organizers?.includes(item.uid) || item.uid === activeTrip?.userId;
    const isCreator = item.uid === activeTrip?.userId;
    const canPromote = currentUserIsOrganizer && !isOrganizer;

    return (
      <View style={[styles.participantItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {item.displayName?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{item.displayName}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
          {isOrganizer && (
            <View style={[styles.badge, { backgroundColor: colors.primary + '15', alignSelf: 'flex-start', marginTop: 4 }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {isCreator ? 'Creador' : 'Organizador'}
              </Text>
            </View>
          )}
        </View>
        
        {canPromote && (
          <TouchableOpacity 
            style={[styles.promoteButton, { backgroundColor: colors.primary }]}
            onPress={() => handlePromote(item.uid)}
          >
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.promoteButtonText}>Hacer Org.</Text>
          </TouchableOpacity>
        )}

        {currentUserIsCreator && isOrganizer && !isCreator && (
          <TouchableOpacity 
            style={[styles.promoteButton, { backgroundColor: '#8E8E93' }]}
            onPress={() => handleDemote(item.uid)}
          >
            <Ionicons name="star-outline" size={16} color="#fff" />
            <Text style={styles.promoteButtonText}>Quitar Org.</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Función para renderizar cada participante
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Participantes</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.uid}
          renderItem={renderParticipant}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {participants.length} {participants.length === 1 ? 'persona se ha unido' : 'personas se han unido'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No hay participantes</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// Estilos de la pantalla de Participantes
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  listContent: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 16, marginLeft: 4 },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatarContainer: { marginRight: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  email: { fontSize: 13 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  promoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  promoteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ParticipantsScreen;
