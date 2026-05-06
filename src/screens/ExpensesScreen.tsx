import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  FlatList,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const ExpensesScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  // Datos de ejemplo para el diseño
  const [expenses] = useState([
    { id: '1', title: 'Cena Restaurante', amount: 45.50, category: 'Comida', icon: 'restaurant', color: '#FF9500', date: 'Hoy' },
    { id: '2', title: 'Uber al Aeropuerto', amount: 28.00, category: 'Transporte', icon: 'car', color: '#5856D6', date: 'Ayer' },
    { id: '3', title: 'Entradas Museo', amount: 60.00, category: 'Ocio', icon: 'ticket', color: '#FF2D55', date: 'Ayer' },
    { id: '4', title: 'Hotel 1ª Noche', amount: 120.00, category: 'Alojamiento', icon: 'bed', color: '#32ADE6', date: '12 May' },
  ]);

  const renderExpenseItem = ({ item }: any) => (
    <TouchableOpacity style={[styles.expenseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '15' }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={[styles.expenseTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.expenseCategory, { color: colors.textSecondary }]}>{item.category} • {item.date}</Text>
      </View>
      <Text style={[styles.expenseAmount, { color: colors.text }]}>-{item.amount.toFixed(2)}€</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton}>
          <LinearGradient
            colors={['#007AFF', '#00C6FF']}
            style={styles.plusButton}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Gastos del Viaje</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gestiona el presupuesto del grupo</Text>
            </View>

            <LinearGradient
              colors={['#1C1C1E', '#3A3A3C']}
              style={styles.summaryCard}
            >
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Total Gastado</Text>
                  <Text style={styles.summaryValue}>253.50€</Text>
                </View>
                <View style={styles.budgetBadge}>
                  <Text style={styles.budgetText}>Presupuesto: 1000€</Text>
                </View>
              </View>
              
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '25%' }]} />
              </View>
              
              <Text style={styles.remainingText}>Te quedan 746.50€ para gastar</Text>
            </LinearGradient>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad Reciente</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 24, paddingBottom: 40 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  plusButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  
  // Summary Card
  summaryCard: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  summaryLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  summaryValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  budgetBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  budgetText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 12 },
  progressBarFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 4 },
  remainingText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  
  // Expense Card
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  expenseCategory: { fontSize: 13 },
  expenseAmount: { fontSize: 16, fontWeight: 'bold' },
});

export default ExpensesScreen;
