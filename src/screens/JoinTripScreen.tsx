import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const JoinTripScreen = () => {
  const navigation = useNavigation<any>();
  const [code, setCode] = useState('');

  const handleJoin = () => {
    // Prototipo: Navegamos directamente.
    // En el futuro validaremos el código contra Firebase.
    navigation.navigate('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Unirme a un Viaje</Text>
              <Text style={styles.subtitle}>Introduce el código que te ha pasado el organizador</Text>
            </View>

            <View style={styles.content}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Código del Viaje</Text>
                <TextInput
                  style={styles.codeInput}
                  placeholder="ABC-123"
                  placeholderTextColor="#C7C7CC"
                  autoCapitalize="characters"
                  maxLength={10}
                  value={code}
                  onChangeText={setCode}
                />
                <Text style={styles.helperText}>Ejemplo: MAD-7890</Text>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
                <Text style={styles.infoText}>
                  Al unirte, podrás ver el itinerario, mapa y gastos compartidos del viaje.
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.joinButton} 
                onPress={handleJoin}
                disabled={code.length < 4}
              >
                <LinearGradient
                  colors={code.length < 4 ? ['#E5E5EA', '#D1D1D6'] : ['#5856D6', '#8E8DFF']}
                  style={styles.gradientButton}
                >
                  <Text style={styles.joinButtonText}>Unirme al Viaje</Text>
                  <Ionicons name="enter-outline" size={20} color="#fff" />
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  inputGroup: {
    gap: 12,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    marginLeft: 4,
  },
  codeInput: {
    backgroundColor: '#F2F2F7',
    padding: 24,
    borderRadius: 20,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    letterSpacing: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  footer: {
    marginBottom: 20,
  },
  joinButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default JoinTripScreen;
