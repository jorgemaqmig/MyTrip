import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  TextInput,
  Image,
  Dimensions,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SocialScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('explorar'); // 'amigos' o 'explorar'

  const exploreTrips = [
    { id: '1', title: 'Aventura en los Alpes', location: 'Suiza', duration: '7 días', color: '#5856D6', icon: 'snow' },
    { id: '2', title: 'Templos de Kyoto', location: 'Japón', duration: '12 días', color: '#FF3B30', icon: 'bonfire' },
    { id: '3', title: 'Ruta del Café', location: 'Colombia', duration: '5 días', color: '#FF9500', icon: 'sunny' },
    { id: '4', title: 'Aurora Boreal', location: 'Islandia', duration: '6 días', color: '#32ADE6', icon: 'flash' },
  ];

  const friends = [
    { id: '1', name: 'Laura García', status: 'En París ahora 🥐', online: true },
    { id: '2', name: 'Carlos Ruiz', status: 'Planeando: Tailandia 🌴', online: false },
    { id: '3', name: 'Elena Sanz', status: 'Recién llegada de Roma 🇮🇹', online: true },
    { id: '4', name: 'Marco Polo', status: 'Explorando la Ruta de la Seda 🐫', online: false },
  ];

  const renderExploreCard = ({ item }: any) => (
    <TouchableOpacity style={styles.exploreCard}>
      <LinearGradient
        colors={[item.color, item.color + 'AA']}
        style={styles.cardGradient}
      >
        <Ionicons name={item.icon} size={40} color="#fff" />
      </LinearGradient>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.cardInfo}>
          <Ionicons name="location-outline" size={14} color="#8E8E93" />
          <Text style={styles.cardSubtitle}>{item.location} • {item.duration}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.saveButton}>
        <Ionicons name="bookmark-outline" size={20} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFriendItem = ({ item }: any) => (
    <TouchableOpacity style={styles.friendItem}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: '#F2F2F7' }]}>
          <Ionicons name="person" size={24} color="#C7C7CC" />
        </View>
        {item.online ? <View style={styles.onlineStatus} /> : null}
      </View>
      <View style={styles.friendContent}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendStatus}>{item.status}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con Buscador */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput 
            placeholder="Buscar viajes o gente..." 
            style={styles.searchInput}
            placeholderTextColor="#8E8E93"
          />
        </View>
      </View>

      {/* Selector de Pestañas */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'explorar' ? styles.activeTab : null]} 
          onPress={() => setActiveTab('explorar')}
        >
          <Text style={[styles.tabText, activeTab === 'explorar' ? styles.activeTabText : null]}>Explorar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'amigos' ? styles.activeTab : null]} 
          onPress={() => setActiveTab('amigos')}
        >
          <Text style={[styles.tabText, activeTab === 'amigos' ? styles.activeTabText : null]}>Amigos</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido Dinámico */}
      <View style={{ flex: 1 }}>
        {activeTab === 'explorar' ? (
          <FlatList
            data={exploreTrips}
            renderItem={renderExploreCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
  },
  exploreCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardGradient: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineStatus: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  friendContent: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  friendStatus: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
});

export default SocialScreen;
