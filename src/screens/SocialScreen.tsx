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

// Pantalla de Social
const SocialScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { setActiveTrip } = useTrip();

  const [activeTab, setActiveTab] = useState('explorar'); 
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

  // Modal Reutilizable Estilo de la App
  const [premiumAlert, setPremiumAlert] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'info';
    icon: string;
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    onConfirm: () => Promise<void> | void;
  }>({
    visible: false,
    type: 'success',
    icon: 'checkmark',
    title: '',
    message: '',
    confirmText: 'Aceptar',
    onConfirm: () => {}
  });
  const [alertLoading, setAlertLoading] = useState(false);

  // Funciones para mostrar y manejar el modal de alerta
  const showPremiumAlert = (config: {
    type: 'success' | 'warning' | 'info';
    icon: string;
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    onConfirm: () => Promise<void> | void;
  }) => {
    setPremiumAlert({
      visible: true,
      ...config
    });
  };

  const closePremiumAlert = () => {
    setPremiumAlert(prev => ({ ...prev, visible: false }));
  };

  // Manejo de la confirmación del modal con soporte para acciones asíncronas
  const handlePremiumConfirm = async () => {
    setAlertLoading(true);
    try {
      await premiumAlert.onConfirm();
    } catch (error) {
      console.error("Error en premium alert confirm:", error);
    } finally {
      setAlertLoading(false);
    }
  };

  // Estados del sistema de Amigos
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [globalSearched, setGlobalSearched] = useState(false);
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, any>>({});

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

  const fetchFriendsData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [friendsList, pendingList] = await Promise.all([
        authService.getFriends(user.uid),
        authService.getPendingRequests(user.uid)
      ]);
      setFriends(friendsList);
      setPendingRequests(pendingList);
    } catch (error) {
      console.error("Error al obtener datos de amigos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la búsqueda global de usuarios
  const handleGlobalSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearchLoading(true);
    setGlobalSearched(true);
    try {
      const results = await authService.searchUsers(searchQuery, user.uid);
      setSearchResults(results);
      
      // Obtener el estado de la relación para cada usuario encontrado
      const statuses: Record<string, any> = {};
      await Promise.all(
        results.map(async (res) => {
          const rel = await authService.getRelationshipStatus(user.uid, res.uid);
          if (rel) {
            statuses[res.uid] = rel;
          }
        })
      );
      setFriendshipStatuses(statuses);
    } catch (error) {
      console.error("Error en la búsqueda global:", error);
      Alert.alert("Error", "No se pudo realizar la búsqueda global en este momento.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Función para enviar solicitud de amistad
  const handleSendFriendRequest = async (targetUid: string) => {
    if (!user) return;
    try {
      await authService.sendFriendRequest(user.uid, targetUid);
      
      // Actualizar el estado de la relación localmente
      const rel = await authService.getRelationshipStatus(user.uid, targetUid);
      if (rel) {
        setFriendshipStatuses(prev => ({
          ...prev,
          [targetUid]: rel
        }));
      }

      showPremiumAlert({
        type: 'success',
        icon: 'paper-plane-outline',
        title: 'Solicitud enviada',
        message: 'Se ha enviado tu solicitud de amistad correctamente.',
        confirmText: '¡Genial!',
        onConfirm: () => closePremiumAlert()
      });
    } catch (error: any) {
      showPremiumAlert({
        type: 'warning',
        icon: 'alert-circle-outline',
        title: 'Atención',
        message: error.message || 'No se pudo enviar la solicitud.',
        confirmText: 'Aceptar',
        onConfirm: () => closePremiumAlert()
      });
    }
  };

  // Funciones para aceptar/rechazar solicitudes y eliminar amigos
  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await authService.acceptFriendRequest(friendshipId);
      
      // Recargar datos
      await fetchFriendsData();
      
      // Si el usuario aceptado está en los resultados de búsqueda, actualizar su estado
      if (searchQuery.trim() !== '') {
        handleGlobalSearch();
      }

      showPremiumAlert({
        type: 'success',
        icon: 'people-outline',
        title: '¡Amistad aceptada!',
        message: 'Ahora sois amigos. ¡Podéis ver vuestros viajes y colaborar!',
        confirmText: '¡Perfecto!',
        onConfirm: () => closePremiumAlert()
      });
    } catch (error: any) {
      showPremiumAlert({
        type: 'warning',
        icon: 'alert-circle-outline',
        title: 'Error',
        message: 'No se pudo aceptar la solicitud.',
        confirmText: 'Aceptar',
        onConfirm: () => closePremiumAlert()
      });
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      await authService.removeFriendship(friendshipId);
      
      // Recargar datos
      await fetchFriendsData();
      
      // Si el usuario rechazado está en los resultados de búsqueda, actualizar su estado
      if (searchQuery.trim() !== '') {
        handleGlobalSearch();
      }

      showPremiumAlert({
        type: 'info',
        icon: 'close-circle-outline',
        title: 'Solicitud rechazada',
        message: 'Has declinado la solicitud de amistad.',
        confirmText: 'Entendido',
        onConfirm: () => closePremiumAlert()
      });
    } catch (error: any) {
      showPremiumAlert({
        type: 'warning',
        icon: 'alert-circle-outline',
        title: 'Error',
        message: 'No se pudo rechazar la solicitud.',
        confirmText: 'Aceptar',
        onConfirm: () => closePremiumAlert()
      });
    }
  };

  // Función para eliminar un amigo con confirmación
  const handleDeleteFriend = (friendshipId: string, friendName: string) => {
    showPremiumAlert({
      type: 'warning',
      icon: 'trash-outline',
      title: '¿Eliminar amigo?',
      message: `¿Estás seguro de que quieres eliminar a ${friendName} de tus amigos? Ya no aparecerá en tu lista.`,
      confirmText: 'Eliminar Amigo',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await authService.removeFriendship(friendshipId);
          await fetchFriendsData();
          closePremiumAlert();
          // Retrasar el modal de confirmación de éxito para permitir que el primero se desvanezca suavemente
          setTimeout(() => {
            showPremiumAlert({
              type: 'success',
              icon: 'checkmark-circle-outline',
              title: 'Amigo eliminado',
              message: `${friendName} ha sido eliminado de tus amigos correctamente.`,
              confirmText: 'Entendido',
              onConfirm: () => closePremiumAlert()
            });
          }, 400);
        } catch (error) {
          showPremiumAlert({
            type: 'warning',
            icon: 'alert-circle-outline',
            title: 'Error',
            message: 'No se pudo eliminar al amigo.',
            confirmText: 'Aceptar',
            onConfirm: () => closePremiumAlert()
          });
        }
      }
    });
  };

  useEffect(() => {
    if (activeTab === 'explorar') {
      fetchPublishedData();
    } else {
      fetchFriendsData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setGlobalSearched(false);
    }
  }, [searchQuery]);

  const filteredTrips = publishedTrips.filter(trip => 
    trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleClonePress = (item: any) => {
    setCopyingTrip(item);
    setNewName(`Copia de ${item.name}`);
    setStartDate('');
    setEndDate('');
    setCopyModalVisible(true);
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
      
      showPremiumAlert({
        type: 'success',
        icon: 'checkmark',
        title: '¡Viaje copiado!',
        message: `El viaje "${newName.trim()}" con destino a ${copyingTrip?.location} y su itinerario se han copiado correctamente en tu cuenta.`,
        confirmText: '¡Genial!',
        onConfirm: () => {
          closePremiumAlert();
          navigation.navigate('MainTabs');
        }
      });
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

  const getFriendsListData = () => {
    const list: any[] = [];
    
    // Si hay solicitudes pendientes, las mostramos como tarjetas al principio
    if (pendingRequests.length > 0 && !searchQuery) {
      list.push({ type: 'header', title: 'Solicitudes Pendientes' });
      pendingRequests.forEach(req => {
        list.push({ type: 'pending_request', data: req });
      });
    }

    // Si hay búsqueda activa
    if (searchQuery.trim() !== '') {
      // 1. Mostrar amigos filtrados localmente
      const filtered = friends.filter(friend => 
        (friend.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (friend.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (filtered.length > 0) {
        list.push({ type: 'header', title: 'Tus Amigos' });
        filtered.forEach(friend => {
          list.push({ type: 'friend', data: friend });
        });
      }

      // 2. Mostrar la tarjeta para buscar globalmente
      list.push({ type: 'global_search_trigger' });

      // 3. Mostrar resultados de la búsqueda global
      if (searchResults.length > 0) {
        list.push({ type: 'header', title: 'Resultados en MyTrip' });
        searchResults.forEach(res => {
          list.push({ type: 'search_result', data: res });
        });
      } else if (globalSearched) {
        list.push({ type: 'no_results', message: 'No se encontraron usuarios con ese nombre o email.' });
      }
    } else {
      // Si no hay búsqueda, simplemente mostramos todos nuestros amigos
      if (friends.length > 0) {
        list.push({ type: 'header', title: `Mis Amigos (${friends.length})` });
        friends.forEach(friend => {
          list.push({ type: 'friend', data: friend });
        });
      } else {
        list.push({ type: 'empty_friends' });
      }
    }
    
    return list;
  };

  const renderFriendsTabItem = ({ item }: any) => {
    switch (item.type) {
      case 'header':
        return (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {item.title}
          </Text>
        );
        
      case 'pending_request': {
        const req = item.data;
        return (
          <View style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.requestLeft}>
              {req.photoURL ? (
                <Image source={{ uri: req.photoURL }} style={styles.requestAvatar} />
              ) : (
                <View style={[styles.requestAvatarPlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                  <Ionicons name="person" size={20} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.requestInfo}>
                <Text style={[styles.requestName, { color: colors.text }]}>{req.displayName || 'Usuario de MyTrip'}</Text>
                <Text style={[styles.requestEmail, { color: colors.textSecondary }]}>{req.email}</Text>
              </View>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity 
                style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleAcceptRequest(req.friendshipId)}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.rejectBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
                onPress={() => handleRejectRequest(req.friendshipId)}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        );
      }
      
      case 'friend': {
        const friend = item.data;
        return (
          <View style={[styles.friendItem, { borderBottomColor: colors.separator }]}>
            <View style={styles.avatarContainer}>
              {friend.photoURL ? (
                <Image source={{ uri: friend.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <Ionicons name="person" size={24} color={isDark ? '#48484A' : '#C7C7CC'} />
                </View>
              )}
            </View>
            <View style={styles.friendContent}>
              <Text style={[styles.friendName, { color: colors.text }]}>{friend.displayName || 'Usuario de MyTrip'}</Text>
              <Text style={[styles.friendStatus, { color: colors.textSecondary }]}>{friend.email}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteFriendBtn}
              onPress={() => handleDeleteFriend(friend.friendshipId, friend.displayName)}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        );
      }
      
      case 'global_search_trigger':
        return (
          <TouchableOpacity 
            style={[styles.globalSearchCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleGlobalSearch}
            disabled={searchLoading}
          >
            {searchLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginRight: 12 }} />
            ) : (
              <Ionicons name="search" size={24} color={colors.primary} style={{ marginRight: 12 }} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.globalSearchTitle, { color: colors.primary }]}>
                Buscar a "{searchQuery}" globalmente
              </Text>
              <Text style={[styles.globalSearchSubtitle, { color: colors.textSecondary }]}>
                Buscar en toda la base de datos de MyTrip por nombre o email
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        );
        
      case 'search_result': {
        const res = item.data;
        const statusObj = friendshipStatuses[res.uid];
        return (
          <View style={[styles.friendItem, { borderBottomColor: colors.separator }]}>
            <View style={styles.avatarContainer}>
              {res.photoURL ? (
                <Image source={{ uri: res.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <Ionicons name="person" size={24} color={isDark ? '#48484A' : '#C7C7CC'} />
                </View>
              )}
            </View>
            <View style={styles.friendContent}>
              <Text style={[styles.friendName, { color: colors.text }]}>{res.displayName || 'Usuario de MyTrip'}</Text>
              <Text style={[styles.friendStatus, { color: colors.textSecondary }]}>{res.email}</Text>
            </View>
            
            {/* Estado de la Amistad dinámico */}
            {!statusObj ? (
              <TouchableOpacity 
                style={[styles.addFriendBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleSendFriendRequest(res.uid)}
              >
                <Ionicons name="person-add-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.addFriendBtnText}>Añadir</Text>
              </TouchableOpacity>
            ) : statusObj.status === 'pending' ? (
              statusObj.isSender ? (
                <View style={styles.pendingStatusBadge}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.pendingStatusText, { color: colors.textSecondary }]}>Enviado</Text>
                </View>
              ) : (
                <View style={styles.requestActions}>
                  <TouchableOpacity 
                    style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleAcceptRequest(statusObj.friendshipId)}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.rejectBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
                    onPress={() => handleRejectRequest(statusObj.friendshipId)}
                  >
                    <Ionicons name="close" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View style={styles.friendsBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" style={{ marginRight: 4 }} />
                <Text style={styles.friendsBadgeText}>Amigos</Text>
              </View>
            )}
          </View>
        );
      }
      
      case 'no_results':
        return (
          <View style={styles.noResultsContainer}>
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
              {item.message}
            </Text>
          </View>
        );
        
      case 'empty_friends':
        return (
          <View style={styles.emptyFriendsContainer}>
            <Ionicons 
              name="people-outline" 
              size={48} 
              color={colors.textSecondary} 
              style={{ opacity: 0.5, marginBottom: 12 }}
            />
            <Text style={[styles.emptyFriendsText, { color: colors.textSecondary }]}>
              Aún no tienes amigos agregados. ¡Busca a tus compañeros de viaje para empezar!
            </Text>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <FlatList
        data={activeTab === 'explorar' ? filteredTrips : getFriendsListData()}
        renderItem={activeTab === 'explorar' ? renderExploreCard : renderFriendsTabItem}
        keyExtractor={(item: any, index) => activeTab === 'explorar' ? item.id : `${item.type}_${index}`}
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
      {/* Modal Premium Reutilizable (Acción / Confirmación / Éxito) */}
      <Modal visible={premiumAlert.visible} transparent animationType="fade">
        <View style={styles.modalOverlayCentred}>
          <View style={[styles.modalContentCentred, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient
              colors={
                premiumAlert.type === 'warning'
                  ? ['#FF3B30', '#D02B20']
                  : premiumAlert.type === 'info'
                  ? ['#32ADE6', '#007AFF']
                  : ['#34C759', '#30B754']
              }
              style={styles.successIconWrapper}
            >
              <Ionicons name={premiumAlert.icon as any} size={40} color="#fff" />
            </LinearGradient>
            
            <Text style={[styles.modalTitleCentred, { color: colors.text }]}>
              {premiumAlert.title}
            </Text>
            
            <Text style={[styles.modalSubtitleCentred, { color: colors.textSecondary }]}>
              {premiumAlert.message}
            </Text>

            <View style={styles.buttonContainerCentred}>
              <TouchableOpacity 
                style={[
                  styles.confirmButtonCentred, 
                  { 
                    backgroundColor: premiumAlert.type === 'warning' ? '#FF3B30' : colors.primary 
                  }
                ]}
                onPress={handlePremiumConfirm}
                disabled={alertLoading}
              >
                {alertLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonTextCentred}>{premiumAlert.confirmText}</Text>
                )}
              </TouchableOpacity>
              
              {premiumAlert.cancelText && (
                <TouchableOpacity 
                  style={[styles.cancelButtonCentred, { borderColor: colors.border, backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}
                  onPress={closePremiumAlert}
                  disabled={alertLoading}
                >
                  <Text style={[styles.cancelButtonTextCentred, { color: colors.text }]}>
                    {premiumAlert.cancelText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  // Nuevos Estilos del Sistema de Amigos
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  requestAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    gap: 2,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
  },
  requestEmail: {
    fontSize: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteFriendBtn: {
    padding: 8,
  },
  globalSearchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 16,
  },
  globalSearchTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  globalSearchSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addFriendBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  pendingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  pendingStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  friendsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#34C75915',
  },
  friendsBadgeText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600',
  },
  noResultsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyFriendsContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyFriendsText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Nuevos Estilos de Modales Premium Centrados
  modalOverlayCentred: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContentCentred: {
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
  alertIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  modalTitleCentred: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitleCentred: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainerCentred: {
    width: '100%',
    gap: 12,
  },
  confirmButtonCentred: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmButtonTextCentred: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonCentred: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonTextCentred: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SocialScreen;
