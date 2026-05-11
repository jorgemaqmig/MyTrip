import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Dimensions,
  Platform,
  ScrollView,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// --- DATOS DE EJEMPLO ---
const individualExpenses = [
  { id: '1', title: 'Cena Restaurante', amount: 45.50, category: 'Comida', icon: 'restaurant', color: '#FF9500', date: '10 May' },
  { id: '2', title: 'Uber al Aeropuerto', amount: 28.00, category: 'Transporte', icon: 'car', color: '#5856D6', date: '10 May' },
  { id: '3', title: 'Entradas Museo', amount: 60.00, category: 'Ocio', icon: 'ticket', color: '#FF2D55', date: '11 May' },
  { id: '4', title: 'Souvenirs', amount: 35.00, category: 'Compras', icon: 'bag', color: '#32ADE6', date: '12 May' },
];

const collectiveExpenses = [
  { id: '1', title: 'Hotel 3 Noches', amount: 300.00, category: 'Alojamiento', icon: 'bed', color: '#32ADE6', date: '10 May', paidBy: 'Juan' },
  { id: '2', title: 'Alquiler Coche', amount: 150.00, category: 'Transporte', icon: 'car', color: '#5856D6', date: '10 May', paidBy: 'Pepe' },
  { id: '3', title: 'Compra Supermercado', amount: 80.00, category: 'Comida', icon: 'cart', color: '#FF9500', date: '11 May', paidBy: 'Juan' },
  { id: '4', title: 'Gasolina', amount: 40.00, category: 'Transporte', icon: 'car', color: '#5856D6', date: '12 May', paidBy: 'Pepe' },
];

const ExpensesScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'individual' | 'collective'>('individual');

  // Calcular datos para los gráficos
  const getIndividualChartData = () => {
    const dataByDate: Record<string, number> = {};
    individualExpenses.forEach(exp => {
      dataByDate[exp.date] = (dataByDate[exp.date] || 0) + exp.amount;
    });
    
    const labels = Object.keys(dataByDate);
    const values = Object.values(dataByDate);
    const maxValue = Math.max(...values, 1); // Evitar div 0

    return labels.map((label, i) => ({
      label,
      value: values[i],
      heightPercentage: (values[i] / maxValue) * 100,
    }));
  };

  const getCollectiveChartData = () => {
    const dataByUser: Record<string, number> = {};
    collectiveExpenses.forEach(exp => {
      dataByUser[exp.paidBy] = (dataByUser[exp.paidBy] || 0) + exp.amount;
    });
    
    const labels = Object.keys(dataByUser);
    const values = Object.values(dataByUser);
    const maxValue = Math.max(...values, 1);

    return labels.map((label, i) => ({
      label,
      value: values[i],
      heightPercentage: (values[i] / maxValue) * 100,
    }));
  };

  const indChartData = getIndividualChartData();
  const colChartData = getCollectiveChartData();
  const totalIndividual = individualExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalCollective = collectiveExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const renderExpenseItem = ({ item }: any) => (
    <TouchableOpacity style={[styles.expenseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '15' }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={[styles.expenseTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.expenseCategory, { color: colors.textSecondary }]}>
          {item.category} • {item.date} {item.paidBy ? `• Pagado por ${item.paidBy}` : ''}
        </Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.expenseAmount, { color: colors.text }]}>
          {activeTab === 'individual' ? '-' : ''}{item.amount.toFixed(2)}€
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
      </View>
    </TouchableOpacity>
  );

  const renderCustomChart = (data: any[], title: string, subtitle: string) => (
    <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      
      <View style={styles.chartBarsContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.chartBarWrapper}>
            <View style={styles.chartValueTooltip}>
              <Text style={[styles.chartValueText, { color: colors.text }]}>{item.value.toFixed(0)}€</Text>
            </View>
            <View style={[styles.chartBarBg, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              <LinearGradient
                colors={[colors.primary, isDark ? '#47a1ff' : '#00C6FF']}
                style={[styles.chartBarFill, { height: `${item.heightPercentage}%` }]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
              />
            </View>
            <Text style={[styles.chartLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header Superior */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerMainTitle, { color: colors.text }]}>Gastos</Text>
        <TouchableOpacity style={styles.addButton}>
          <LinearGradient
            colors={[colors.primary, isDark ? '#47a1ff' : '#0056b3']}
            style={styles.plusButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tabs / Segmented Control */}
      <View style={styles.tabsContainer}>
        <View style={[styles.tabsBg, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'individual' && [styles.activeTab, { backgroundColor: colors.card }]]}
            onPress={() => setActiveTab('individual')}
          >
            <Text style={[styles.tabText, activeTab === 'individual' ? { color: colors.text, fontWeight: '700' } : { color: colors.textSecondary }]}>
              Individuales
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'collective' && [styles.activeTab, { backgroundColor: colors.card }]]}
            onPress={() => setActiveTab('collective')}
          >
            <Text style={[styles.tabText, activeTab === 'collective' ? { color: colors.text, fontWeight: '700' } : { color: colors.textSecondary }]}>
              Colectivos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido principal */}
      <FlatList
        data={activeTab === 'individual' ? individualExpenses : collectiveExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Gráfico Dinámico */}
            {activeTab === 'individual' 
              ? renderCustomChart(indChartData, "Gasto por Día", `Total: ${totalIndividual.toFixed(2)}€`)
              : renderCustomChart(colChartData, "Aportación por Persona", `Bote total: ${totalCollective.toFixed(2)}€`)
            }

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {activeTab === 'individual' ? 'Mis Movimientos' : 'Gastos del Grupo'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={60} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Aún no hay gastos</Text>
            <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
              {activeTab === 'individual' ? 'Registra tus gastos personales aquí' : 'Los gastos compartidos aparecerán aquí'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 16,
  },
  headerMainTitle: { fontSize: 20, fontWeight: '800' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  addButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  plusButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  
  // Tabs
  tabsContainer: { paddingHorizontal: 20, marginBottom: 20 },
  tabsBg: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: { fontSize: 14, fontWeight: '600' },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  // Custom Chart
  chartContainer: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  chartHeader: { marginBottom: 24, alignItems: 'center' },
  chartTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  chartSubtitle: { fontSize: 14, fontWeight: '500' },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
  },
  chartBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  chartValueTooltip: { marginBottom: 8 },
  chartValueText: { fontSize: 12, fontWeight: '700' },
  chartBarBg: {
    width: 28,
    height: 120,
    borderRadius: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 12,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 14,
  },
  chartLabel: { fontSize: 12, fontWeight: '600', maxWidth: 60, textAlign: 'center' },

  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  
  // Expense Card
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
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
  categoryIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  expenseCategory: { fontSize: 12, fontWeight: '500' },
  amountContainer: { flexDirection: 'row', alignItems: 'center' },
  expenseAmount: { fontSize: 16, fontWeight: '800' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyStateSub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});

export default ExpensesScreen;
