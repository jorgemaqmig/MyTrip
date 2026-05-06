import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const SocialScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('explorar'); // 'amigos' o 'explorar'

  const exploreTrips = [
    { id: '1', title: 'Aventura en los Alpes', location: 'Suiza', duration: '7 días', color: '#5856D6', icon: 'snow' as any },
    { id: '2', title: 'Templos de Kyoto', location: 'Japón', duration: '12 días', color: '#FF3B30', icon: 'bonfire' as any },
    { id: '3', title: 'Ruta del Café', location: 'Colombia', duration: '5 días', color: '#FF9500', icon: 'sunny' as any },
    { id: '4', title: 'Aurora Boreal', location: 'Islandia', duration: '6 días', color: '#32ADE6', icon: 'flash' as any },
  ];

  const friends = [
    { id: '1', name: 'Laura García', status: 'En París ahora 🥐', online: true },
    { id: '2', name: 'Carlos Ruiz', status: 'Planeando: Tailandia 🌴', online: false },
    { id: '3', name: 'Elena Sanz', status: 'Recién llegada de Roma 🇮🇹', online: true },
    { id: '4', name: 'Marco Polo', status: 'Explorando la Ruta de la Seda 🐫', online: false },
  ];

  const renderExploreCard = ({ item }: any) => (
    <TouchableOpacity style={[styles.exploreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient
        colors={[item.color, item.color + 'AA']}
        style={styles.cardGradient}
      >
        <Ionicons name={item.icon} size={40} color="#fff" />
      </LinearGradient>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
        <View style={styles.cardInfo}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{item.location} • {item.duration}</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.saveButton, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
        <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        data={(activeTab === 'explorar' ? exploreTrips : friends) as any[]}
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
                  placeholder="Buscar viajes o gente..." 
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={[styles.tabContainer, { borderBottomColor: colors.separator }]}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'explorar' && [styles.activeTab, { borderBottomColor: colors.primary }]]} 
                onPress={() => setActiveTab('explorar')}
              >
                <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'explorar' && { color: colors.primary }]}>Explorar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'amigos' && [styles.activeTab, { borderBottomColor: colors.primary }]]} 
                onPress={() => setActiveTab('amigos')}
              >
                <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'amigos' && { color: colors.primary }]}>Amigos</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 24 },
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
  cardGradient: { width: 80, height: 80, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardSubtitle: { fontSize: 14 },
  saveButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  friendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  onlineStatus: { position: 'absolute', right: 2, bottom: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#34C759', borderWidth: 2 },
  friendContent: { flex: 1, marginLeft: 12 },
  friendName: { fontSize: 16, fontWeight: '600' },
  friendStatus: { fontSize: 13, marginTop: 2 },
});

export default SocialScreen;
