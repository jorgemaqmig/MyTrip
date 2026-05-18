import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { tripService } from '../services/tripService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { Calendar } from 'react-native-calendars';

const { width } = Dimensions.get('window');

const SocialScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { setActiveTrip } = useTrip();

  const [activeTab, setActiveTab] = useState('explorar'); // 'amigos' o 'explorar'
  const [publishedTrips, setPublishedTrips] = useState<any[]>([]);
  const [ownersMap, setOwnersMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados de clonación/copiado de viaje
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [copyingTrip, setCopyingTrip] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successTimeoutId, setSuccessTimeoutId] = useState<any>(null);

  const friends = [
    { id: '1', name: 'Laura García', status: 'En París ahora 🥐', online: true },
    { id: '2', name: 'Carlos Ruiz', status: 'Planeando: Tailandia 🌴', online: false },
    { id: '3', name: 'Elena Sanz', status: 'Recién llegada de Roma 🇮🇹', online: true },
    { id: '4', name: 'Marco Polo', status: 'Explorando la Ruta de la Seda 🐫', online: false },
  ];

  const fetchPublishedData = async () => {
    if (activeTab !== 'explorar') return;
    setLoading(true);
    try {
      const trips = await tripService.getPublishedTrips();
      setPublishedTrips(trips);

      // Obtener datos del propietario para cada userId único
      const uniqueUserIds = Array.from(new Set(trips.map(t => t.userId)));
      const usersData: Record<string, any> = {};
      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          const userData = await authService.getUserData(uid);
          if (userData) {
            usersData[uid] = userData;
          }
        })
      );
      setOwnersMap(usersData);
    } catch (error) {
      console.error("Error al obtener viajes publicados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishedData();
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (successTimeoutId) {
        clearTimeout(successTimeoutId);
      }
    };
  }, [successTimeoutId]);

  const filteredTrips = publishedTrips.filter(trip => 
    trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClonePress = (item: any) => {
    setCopyingTrip(item);
    setNewName(`Copia de ${item.name}`);
    setStartDate('');
    setEndDate('');
    setCopyModalVisible(true);
  };

  const handleSuccessClose = () => {
    if (successTimeoutId) {
      clearTimeout(successTimeoutId);
    }
    setSuccessModalVisible(false);
    navigation.navigate('MainTabs');
  };

  const handleCloneTrip = async () => {
    if (!user) {
      Alert.alert("Atención", "Debes iniciar sesión para copiar un viaje");
      return;
    }
    if (!newName.trim()) {
      Alert.alert("Atención", "Introduce un nombre para tu viaje");
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert("Atención", "Selecciona las fechas para tu viaje");
      return;
    }

    setCloning(true);
    try {
      // 1. Crear el nuevo viaje en la cuenta del usuario copiando imagen, destino y localización
      const newTripData = {
        userId: user.uid,
        name: newName.trim(),
        location: copyingTrip.location,
        latitude: copyingTrip.latitude || null,
        longitude: copyingTrip.longitude || null,
        image: copyingTrip.image || null,
        startDate,
        endDate,
        status: 'Planeado' as const,
      };
      
      const newTripId = await tripService.createTrip(newTripData);

      // 2. Obtener los puntos del itinerario del viaje original
      const originalPoints = await tripService.getTripPoints(copyingTrip.id);

      // 3. Copiar cada punto en el nuevo viaje
      await Promise.all(
        originalPoints.map(async (point) => {
          const { id, ...pointData } = point;
          await tripService.addPointToTrip(newTripId, pointData);
        })
      );

      // 4. Activar el viaje y navegar
      setActiveTrip({
        id: newTripId,
        createdAt: new Date(),
        ...newTripData
      });

      setCopyModalVisible(false);
      setSuccessModalVisible(true);

      const timer = setTimeout(() => {
        setSuccessModalVisible(false);
        navigation.navigate('MainTabs');
      }, 3500);
      setSuccessTimeoutId(timer);
    } catch (error) {
      console.error("Error al clonar viaje:", error);
      Alert.alert("Error", "No se pudo copiar el viaje en este momento.");
    } finally {
      setCloning(false);
    }
  };

  const handleDayPress = (day: any) => {
    if (selectingStartDate) {
      setStartDate(day.dateString);
      setSelectingStartDate(false);
    } else {
      setEndDate(day.dateString);
      setShowCalendar(false);
      setSelectingStartDate(true);
    }
  };

  const markedDates: any = {};
  if (startDate) markedDates[startDate] = { selected: true, startingDay: true, color: colors.primary };
  if (endDate) markedDates[endDate] = { selected: true, endingDay: true, color: colors.primary };

  const renderExploreCard = ({ item }: any) => {
    const ownerName = ownersMap[item.userId]?.displayName || 'Viajero';
    const ownerPhoto = ownersMap[item.userId]?.photoURL;

    const fallbackColors = ['#5856D6', '#FF3B30', '#FF9500', '#32ADE6', '#34C759'];
    const colorIndex = item.name.charCodeAt(0) % fallbackColors.length;
    const fallbackColor = fallbackColors[colorIndex];

    return (
      <TouchableOpacity 
        style={[styles.exploreCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.8}
        onPress={() => {
          Alert.alert(
            item.name,
            `Destino: ${item.location}\nOrganizador: ${ownerName}\nFechas: del ${item.startDate} al ${item.endDate}`,
            [
              { text: 'Clonar Viaje', onPress: () => handleClonePress(item) },
              { text: 'Cancelar', style: 'cancel' }
            ]
          );
        }}
      >
        <View style={styles.cardLeft}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.cardImage} />
          ) : (
            <LinearGradient
              colors={[fallbackColor, fallbackColor + 'AA']}
              style={styles.cardGradient}
            >
              <Ionicons name="airplane" size={32} color="#fff" />
            </LinearGradient>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={styles.cardInfo}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          
          <View style={styles.ownerRow}>
            {ownerPhoto ? (
              <Image source={{ uri: ownerPhoto }} style={styles.ownerAvatar} />
            ) : (
              <View style={[styles.ownerAvatarPlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                <Ionicons name="person" size={10} color={colors.textSecondary} />
              </View>
            )}
            <Text style={[styles.ownerNameText, { color: colors.textSecondary }]} numberOfLines={1}>
              Por: <Text style={{ fontWeight: '700', color: colors.text }}>{ownerName}</Text>
            </Text>
          </View>
        </View>
        
        {/* Botón rápido de copiar viaje */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary + '15' }]}
          onPress={() => handleClonePress(item)}
        >
          <Ionicons name="copy-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderFriendItem = ({ item }: any) => (
    <TouchableOpacity style={[styles.friendItem, { borderBottomColor: colors.separator }]}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
          <Ionicons name="person" size={24} color={isDark ? '#48484A' : '#C7C7CC'} />
        </View>
        {item.online ? <View style={[styles.onlineStatus, { borderColor: colors.background }]} /> : null}
      </View>
      <View style={styles.friendContent}>
        <Text style={[styles.friendName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.friendStatus, { color: colors.textSecondary }]}>{item.status}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={isDark ? '#48484A' : '#C7C7CC'} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <FlatList
        data={activeTab === 'explorar' ? filteredTrips : filteredFriends}
        renderItem={activeTab === 'explorar' ? renderExploreCard : renderFriendItem}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Social</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Conecta con otros viajeros y explora rutas</Text>
            </View>

            <View style={styles.searchContainer}>
              <View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                <Ionicons name="search" size={18} color={colors.textSecondary} />
                <TextInput 
                  placeholder={activeTab === 'explorar' ? "Buscar por viaje o destino..." : "Buscar amigos..."} 
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.tabContainer, { borderBottomColor: colors.separator }]}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'explorar' && [styles.activeTab, { borderBottomColor: colors.primary }]]} 
                onPress={() => {
                  setActiveTab('explorar');
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'explorar' && { color: colors.primary }]}>Explorar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'amigos' && [styles.activeTab, { borderBottomColor: colors.primary }]]} 
                onPress={() => {
                  setActiveTab('amigos');
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'amigos' && { color: colors.primary }]}>Amigos</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'explorar' ? "compass-outline" : "people-outline"} 
                size={48} 
                color={colors.textSecondary} 
                style={{ opacity: 0.5, marginBottom: 10 }}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeTab === 'explorar' 
                  ? "No hay viajes publicados actualmente." 
                  : "No se encontraron amigos."}
              </Text>
            </View>
          )
        }
      />

      {/* Modal de Copiar / Clonar Viaje */}
      <Modal visible={copyModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Copiar Viaje</Text>
              <TouchableOpacity onPress={() => setCopyModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.cloneIntro}>
                <Ionicons name="copy" size={32} color={colors.primary} />
                <Text style={[styles.cloneIntroText, { color: colors.textSecondary }]}>
                  Se creará un nuevo viaje en tu cuenta copiando el destino ({copyingTrip?.location}) y el itinerario de paradas completo. Las fechas y el nombre del viaje son personales.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Nombre de tu viaje</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', color: colors.text, borderColor: colors.border }]}
                  placeholder="Ej: Mi Ruta en Italia"
                  placeholderTextColor={colors.textSecondary}
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.dateContainer}>
                <TouchableOpacity 
                  style={[styles.datePicker, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]} 
                  onPress={() => { setShowCalendar(true); setSelectingStartDate(true); }}
                >
                  <Text style={[styles.label, { color: colors.text, marginBottom: 4 }]}>Fecha Inicio</Text>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    <Text style={[styles.dateValue, { color: colors.text }, !startDate ? { color: colors.textSecondary } : null]}>
                      {startDate || 'Día inicial'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.datePicker, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]} 
                  onPress={() => { setShowCalendar(true); setSelectingStartDate(false); }}
                >
                  <Text style={[styles.label, { color: colors.text, marginBottom: 4 }]}>Fecha Fin</Text>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    <Text style={[styles.dateValue, { color: colors.text }, !endDate ? { color: colors.textSecondary } : null]}>
                      {endDate || 'Día final'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: colors.primary }]} 
                onPress={handleCloneTrip}
                disabled={cloning}
              >
                {cloning ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Copiar y Activar Viaje</Text>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal del Calendario para selección de fechas */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.calendarOverlay}>
          <View style={[styles.calendarModal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectingStartDate ? 'Selecciona fecha de inicio' : 'Selecciona fecha de fin'}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                backgroundColor: colors.card,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: isDark ? '#48484A' : '#d9e1e8',
                dotColor: colors.primary,
                selectedDotColor: '#ffffff',
                arrowColor: colors.primary,
                disabledArrowColor: colors.border,
                monthTextColor: colors.text,
                indicatorColor: colors.primary,
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Éxito de Copiado */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={[styles.successContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient
              colors={['#34C759', '#30B754']}
              style={styles.successIconWrapper}
            >
              <Ionicons name="checkmark" size={40} color="#fff" />
            </LinearGradient>
            <Text style={[styles.successTitle, { color: colors.text }]}>¡Viaje copiado!</Text>
            <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
              El viaje "{newName.trim()}" con destino a {copyingTrip?.location} y su itinerario se han copiado correctamente en tu cuenta.
            </Text>
            <TouchableOpacity 
              style={[styles.successButton, { backgroundColor: colors.primary }]}
              onPress={handleSuccessClose}
            >
              <Text style={styles.successButtonText}>¡Genial!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 24, paddingBottom: 40 },
  backButton: { marginBottom: 20, width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  searchContainer: { marginBottom: 24 },
  searchBar: { height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  tabContainer: { flexDirection: 'row', marginBottom: 24, borderBottomWidth: 1 },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
  activeTab: { borderBottomWidth: 3 },
  tabText: { fontSize: 16, fontWeight: '600' },
  exploreCard: { borderRadius: 20, marginBottom: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cardLeft: { width: 80, height: 80, borderRadius: 16, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  cardGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 16, justifyContent: 'center', gap: 3 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardSubtitle: { fontSize: 13 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ownerAvatar: { width: 18, height: 18, borderRadius: 9 },
  ownerAvatarPlaceholder: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  ownerNameText: { fontSize: 12 },
  saveButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  friendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  onlineStatus: { position: 'absolute', right: 2, bottom: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#34C759', borderWidth: 2 },
  friendContent: { flex: 1, marginLeft: 12 },
  friendName: { fontSize: 16, fontWeight: '600' },
  friendStatus: { fontSize: 13, marginTop: 2 },
  loadingContainer: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { paddingVertical: 60, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, textAlign: 'center' },
  // Modal de clonación
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%', borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  cloneIntro: { flexDirection: 'row', gap: 15, alignItems: 'center', marginBottom: 24, paddingRight: 10 },
  cloneIntroText: { fontSize: 13, flex: 1, lineHeight: 18 },
  inputGroup: { gap: 8, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1 },
  dateContainer: { flexDirection: 'row', gap: 16, marginBottom: 30 },
  datePicker: { flex: 1, padding: 14, borderRadius: 12, gap: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateValue: { fontSize: 15, fontWeight: '500' },
  submitButton: { paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // Calendario modal
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  calendarModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  // Modal de éxito de copiado (Estilo Premium idéntico al de ajustes)
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContent: {
    width: '90%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  successButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SocialScreen;
