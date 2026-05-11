import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Share, 
  Clipboard,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTrip } from '../context/TripContext';
import { tripService } from '../services/tripService';
import { StatusBar } from 'expo-status-bar';

const InviteFriendsScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { activeTrip, setActiveTrip } = useTrip();

  // Generar código si no existe (para viajes antiguos)
  React.useEffect(() => {
    const checkAndGenerateCode = async () => {
      if (activeTrip && !activeTrip.inviteCode && activeTrip.id) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newCode = '';
        for (let i = 0; i < 6; i++) {
          newCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        try {
          await tripService.updateTrip(activeTrip.id, { inviteCode: newCode });
          setActiveTrip({ ...activeTrip, inviteCode: newCode });
        } catch (e) {
          console.error("Error generating code for old trip:", e);
        }
      }
    };
    checkAndGenerateCode();
  }, [activeTrip]);

  const inviteCode = activeTrip?.inviteCode || '...';

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `¡Únete a mi viaje "${activeTrip?.name}" en MyTrip! Usa este código de invitación: ${inviteCode}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(inviteCode);
    if (Platform.OS !== 'ios') {
      Alert.alert('Copiado', 'Código copiado al portapapeles');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Invitar Amigos</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="people" size={60} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>¡Viajar juntos es mejor!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Comparte este código con tus amigos para que puedan unirse a tu aventura y gestionar juntos los gastos e itinerario.
        </Text>

        <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>CÓDIGO DE INVITACIÓN</Text>
          <View style={styles.codeRow}>
            <Text style={[styles.codeText, { color: colors.text }]}>{inviteCode}</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
              <Ionicons name="copy-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <LinearGradient
            colors={[colors.primary, isDark ? '#47a1ff' : '#0056b3']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.shareButtonText}>Compartir Código</Text>
            <Ionicons name="share-social" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1C1C1E' : '#F8F9FB' }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Solo las personas con este código podrán ver y editar los detalles del viaje.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

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
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40, paddingHorizontal: 10 },
  codeCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  codeLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  codeText: { fontSize: 36, fontWeight: '800', letterSpacing: 2 },
  copyButton: { padding: 8 },
  shareButton: { width: '100%', borderRadius: 18, overflow: 'hidden', marginBottom: 32 },
  gradientButton: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  shareButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', padding: 20, borderRadius: 20, gap: 12, alignItems: 'center', width: '100%' },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
});

export default InviteFriendsScreen;
