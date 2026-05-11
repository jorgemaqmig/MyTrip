import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';

const JoinTripScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!user) return;
    if (!code.trim()) return;

    setLoading(true);
    try {
      await tripService.joinTripByCode(user.uid, code);
      Alert.alert('¡Éxito!', 'Te has unido al viaje correctamente.', [
        { text: 'Genial', onPress: () => navigation.navigate('MyTrips') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo unir al viaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexOne}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Unirme a un Viaje</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Introduce el código que te ha pasado el organizador</Text>
            </View>

            <View style={styles.content}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Código del Viaje</Text>
                <TextInput
                  style={[styles.codeInput, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', color: colors.text }]}
                  placeholder="------"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  maxLength={10}
                  value={code}
                  onChangeText={setCode}
                />
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>Ejemplo: MADP890</Text>
              </View>

              <View style={[styles.infoBox, { backgroundColor: isDark ? '#1C1C1E' : '#F8F9FB' }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Al unirte, podrás ver el itinerario, mapa y gastos compartidos del viaje.
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoin}
                disabled={code.length < 4 || loading}
              >
                <LinearGradient
                  colors={code.length < 4 || loading ? [colors.border, colors.border] : ['#5856D6', '#8E8DFF']}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.joinButtonText}>Unirme al Viaje</Text>
                      <Ionicons name="enter-outline" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexOne: { flex: 1 },
  inner: { flex: 1, padding: 24 },
  backButton: { marginBottom: 20, width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: 48 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 22 },
  content: { flex: 1 },
  inputGroup: { gap: 12, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  codeInput: { padding: 24, borderRadius: 20, fontSize: 32, fontWeight: 'bold', textAlign: 'center', letterSpacing: 4 },
  helperText: { fontSize: 13, textAlign: 'center' },
  infoBox: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  footer: { marginBottom: 20 },
  joinButton: { borderRadius: 20, overflow: 'hidden' },
  gradientButton: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  joinButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default JoinTripScreen;
