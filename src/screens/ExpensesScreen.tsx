import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Dimensions,
  Platform
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
      <View style={styles.amountContainer}>
        <Text style={[styles.expenseAmount, { color: colors.text }]}>-{item.amount.toFixed(2)}€</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton}>
          <LinearGradient
            colors={[colors.primary, isDark ? '#47a1ff' : '#0056b3']}
            style={styles.plusButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={28} color="#fff" />
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
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Controla el presupuesto de tu aventura</Text>
            </View>

            <LinearGradient
              colors={isDark ? ['#2C2C2E', '#1C1C1E'] : [colors.primary, '#00C6FF']}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryRow}>
                <View>
                  <Text style={[styles.summaryLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.8)' }]}>Total Gastado</Text>
                  <Text style={styles.summaryValue}>253.50€</Text>
                </View>
                <View style={[styles.budgetBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.budgetText}>Meta: 1000€</Text>
                </View>
              </View>
              
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={['#34C759', '#30D158']}
                  style={[styles.progressBarFill, { width: '25%' }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              
              <View style={styles.remainingRow}>
                <Ionicons name="trending-down" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={styles.remainingText}>Te quedan 746.50€ disponibles</Text>
              </View>
            </LinearGradient>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad reciente</Text>
              <TouchableOpacity>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Ver todo</Text>
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
  listContent: { padding: 24, paddingBottom: 100 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  addButton: { width: 48, height: 48 },
  plusButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  header: { marginBottom: 28 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 16, lineHeight: 22 },
  
  // Summary Card
  summaryCard: {
    padding: 24,
    borderRadius: 30,
    marginBottom: 36,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  summaryLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { color: '#fff', fontSize: 36, fontWeight: '800' },
  budgetBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  budgetText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 5, marginBottom: 16, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  remainingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  remainingText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  
  // Expense Card
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      }
    })
  },
  categoryIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  expenseCategory: { fontSize: 13, fontWeight: '500' },
  amountContainer: { flexDirection: 'row', alignItems: 'center' },
  expenseAmount: { fontSize: 16, fontWeight: '800' },
});

export default ExpensesScreen;
