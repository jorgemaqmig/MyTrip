import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  Platform,
  Animated,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useTrip } from '../context/TripContext';
import { tripService } from '../services/tripService';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const TripSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip, setActiveTrip } = useTrip();
  const { colors, isDark } = useTheme();
  
  const [name, setName] = useState(activeTrip?.name || '');
  const [startDate, setStartDate] = useState(activeTrip?.startDate || '');
  const [endDate, setEndDate] = useState(activeTrip?.endDate || '');
  const [imageUri, setImageUri] = useState<string | null>(activeTrip?.image || null);
  const [isPublished, setIsPublished] = useState(activeTrip?.isPublished || false);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const triggerToast = () => {
    setShowToast(true);
    // Auto-dismiss y volver tras 2 segundos si el usuario no pulsa el botón
    const timer = setTimeout(() => {
      setShowToast(prev => {
        if (prev) {
          navigation.goBack();
          return false;
        }
        return false;
      });
    }, 2000);
    return () => clearTimeout(timer);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Foto del viaje',
      'Selecciona una opción',
      [
        { text: 'Cámara', onPress: takePhoto },
        { text: 'Galería', onPress: pickImage },
        { text: 'Eliminar foto', style: 'destructive', onPress: () => setImageUri(null) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Atención', 'Necesitamos acceso a tu cámara');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageUri(base64Image);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Atención', 'Necesitamos acceso a tu galería');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageUri(base64Image);
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del viaje no puede estar vacío');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Error', 'Debes seleccionar las fechas del viaje');
      return;
    }

    setLoading(true);
    try {
      const tripData = {
        name,
        startDate,
        endDate,
        image: imageUri || undefined,
        isPublished
      };

      if (activeTrip?.id) {
        await tripService.updateTrip(activeTrip.id, tripData);
        setActiveTrip({ ...activeTrip, ...tripData });
        triggerToast();
      }
    } catch (e: any) {
      Alert.alert('Error', 'No se pudieron actualizar los ajustes');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markedDates: any = {};
  if (startDate) markedDates[startDate] = { selected: true, startingDay: true, color: colors.primary };
  if (endDate) markedDates[endDate] = { selected: true, endingDay: true, color: colors.primary };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ajustes del Viaje</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <TouchableOpacity onPress={showImageOptions} style={styles.imageSection}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.tripImage} />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>Añadir foto de portada</Text>
              </View>
            )}
            <LinearGradient 
              colors={[colors.primary, isDark ? '#47a1ff' : '#0056b3']} 
              style={styles.editImageBadge}
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>NOMBRE DEL VIAJE</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', 
                  color: colors.text,
                  borderColor: colors.border,
                  borderWidth: isDark ? 1 : 0
                }]}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Verano en Italia"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>FECHAS</Text>
              <TouchableOpacity 
                style={[styles.datePickerBtn, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]} 
                onPress={() => setShowCalendar(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {startDate ? `${startDate} al ${endDate || '...'}` : 'Seleccionar fechas'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={[styles.switchTitle, { color: colors.text }]}>Publicar viaje</Text>
                  <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>Hacer visible en la pestaña Social</Text>
                </View>
                <Switch
                  value={isPublished}
                  onValueChange={setIsPublished}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? '#fff' : isPublished ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.codeHeader}>
                <Ionicons name="people-outline" size={20} color={colors.primary} />
                <Text style={[styles.codeTitle, { color: colors.text }]}>Código de Invitación</Text>
              </View>
              <View style={styles.codeRow}>
                <Text style={[styles.codeValue, { color: colors.text }]}>{activeTrip?.inviteCode || '...'}</Text>
                <TouchableOpacity 
                  style={[styles.inviteLink, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => navigation.navigate('InviteFriends')}
                >
                  <Text style={[styles.inviteLinkText, { color: colors.primary }]}>Invitar</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [colors.border, colors.border] : [colors.primary, isDark ? '#47a1ff' : '#0056b3']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Éxito de Guardar */}
      <Modal visible={showToast} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={[styles.successContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient
              colors={['#34C759', '#30B754']}
              style={styles.successIconWrapper}
            >
              <Ionicons name="checkmark" size={40} color="#fff" />
            </LinearGradient>
            <Text style={[styles.successTitle, { color: colors.text }]}>¡Guardado con éxito!</Text>
            <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
              Los ajustes de tu viaje se han actualizado correctamente.
            </Text>
            <TouchableOpacity 
              style={[styles.successButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowToast(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successButtonText}>Genial</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal del Calendario */}
      {showCalendar && (
        <View style={styles.calendarModal}>
          <View style={[styles.calendarContent, { backgroundColor: colors.card }]}>
            <View style={styles.calendarHeader}>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {selectingStartDate ? 'Selecciona fecha de inicio' : 'Selecciona fecha de fin'}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close-circle" size={30} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                calendarBackground: colors.card,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: isDark ? '#444' : '#d9e1e8',
                monthTextColor: colors.text,
                arrowColor: colors.primary,
              }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  imageSection: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
  },
  tripImage: { width: '100%', height: '100%' },
  imagePlaceholder: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: { marginTop: 8, fontSize: 14, fontWeight: '600' },
  editImageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  form: { gap: 24, marginBottom: 32 },
  inputGroup: { gap: 10 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  dateText: { fontSize: 16, fontWeight: '500' },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: { flex: 1 },
  switchTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  switchSubtitle: { fontSize: 13 },
  saveButton: { borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  gradientButton: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  calendarModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000,
  },
  calendarContent: {
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: { fontSize: 18, fontWeight: '700' },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContent: {
    width: '100%',
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
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  inviteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  inviteLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default TripSettingsScreen;
