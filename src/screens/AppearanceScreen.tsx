import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// Pantalla de Apariencia
const AppearanceScreen = () => {
  const navigation = useNavigation<any>();
  const { theme, setTheme, colors, isDark } = useTheme();

  const ThemeOption = ({ id, title, icon, color1, color2 }: any) => {
    const isSelected = theme === id;
    
    // Renderiza cada opción de tema
    return (
      <TouchableOpacity 
        style={[
          styles.themeOption, 
          { backgroundColor: colors.card, borderColor: colors.border },
          isSelected && { borderColor: colors.primary, backgroundColor: isDark ? '#1C1C1E' : '#F0F7FF' }
        ]}
        onPress={() => setTheme(id)}
        activeOpacity={0.8}
      >
        <View style={styles.themePreview}>
          <LinearGradient
            colors={[color1, color2]}
            style={styles.previewGradient}
          >
            <Ionicons name={icon} size={32} color="#fff" />
          </LinearGradient>
          
          {isSelected && (
            <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.themeInfo}>
          <Text style={[
            styles.themeTitle, 
            { color: colors.text },
            isSelected && { color: colors.primary }
          ]}>
            {title}
          </Text>
          <Text style={styles.themeStatus}>{isSelected ? 'Activado' : 'Disponible'}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Renderiza la pantalla de apariencia
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Apariencia</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Personaliza cómo se ve MyTrip en tu dispositivo
          </Text>
        </View>

        {/* Opciones de temas */}
        <View style={styles.themesGrid}>
          <ThemeOption 
            id="light"
            title="Modo Claro"
            icon="sunny"
            color1="#007AFF"
            color2="#00C6FF"
          />
          
          <ThemeOption 
            id="dark"
            title="Modo Oscuro"
            icon="moon"
            color1="#1C1C1E"
            color2="#3A3A3C"
          />

          <ThemeOption 
            id="system"
            title="Sistema"
            icon="settings-outline"
            color1="#8E8E93"
            color2="#C7C7CC"
          />
        </View>

        <View style={[styles.infoCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF9F2' }]}>
          <Ionicons name="bulb-outline" size={24} color={isDark ? colors.primary : "#FF9500"} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: isDark ? colors.primary : "#FF9500" }]}>¿Sabías que...?</Text>
            <Text style={[styles.infoText, { color: isDark ? colors.textSecondary : "#8B5E3C" }]}>
              El modo oscuro ayuda a reducir la fatiga visual y puede ahorrar batería en pantallas OLED mientras planeas tu próximo viaje.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Estilos para la pantalla de apariencia
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  themeOption: {
    width: (width - 48 - 16) / 2,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  themePreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 12,
    position: 'relative',
  },
  previewGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  themeInfo: {
    alignItems: 'center',
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  themeStatus: {
    fontSize: 12,
    color: '#8E8E93',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    marginTop: 16,
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AppearanceScreen;
