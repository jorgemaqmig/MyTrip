import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { authService } from '../services/authService';
import { Alert } from 'react-native';

const MoreScreen = () => {
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigation.navigate('Login');
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const MenuItem = ({ icon, title, subtitle, onPress, color }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Más opciones</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Gestión del Viaje</Text>
          <View style={styles.card}>
            <MenuItem 
              icon="wallet-outline" 
              title="Gastos" 
              subtitle="Controla el presupuesto del grupo"
              color="#32ADE6"
              onPress={() => navigation.navigate('Gastos')}
            />
            <View style={styles.separator} />
            <MenuItem 
              icon="document-lock-outline" 
              title="Caja Fuerte" 
              subtitle="Tus documentos importantes offline"
              color="#5856D6"
              onPress={() => navigation.navigate('Documentos')}
            />
            <View style={styles.separator} />
            <MenuItem 
              icon="people-outline" 
              title="Invitar Amigos" 
              subtitle="Comparte el código del viaje"
              color="#FF9500"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Configuración</Text>
          <View style={styles.card}>
            <MenuItem 
              icon="options-outline" 
              title="Ajustes del Viaje" 
              subtitle="Nombre, fechas y participantes"
              color="#8E8E93"
              onPress={() => {}}
            />
            <View style={styles.separator} />
            <MenuItem 
              icon="exit-outline" 
              title="Cerrar Sesión" 
              color="#FF3B30"
              onPress={handleLogout}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Necesitas ayuda con el viaje?</Text>
          <TouchableOpacity>
            <Text style={styles.supportLink}>Contactar soporte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 76,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  supportLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default MoreScreen;
