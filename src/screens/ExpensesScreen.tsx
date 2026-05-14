import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { expenseService, Expense, ExpenseCategory, ExpenseType } from '../services/expenseService';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const CATEGORIES: { id: ExpenseCategory; icon: any; color: string }[] = [
  { id: 'Comida', icon: 'restaurant', color: '#FF9500' },
  { id: 'Transporte', icon: 'car', color: '#5856D6' },
  { id: 'Ocio', icon: 'ticket', color: '#FF2D55' },
  { id: 'Souvenir', icon: 'gift', color: '#32ADE6' },
  { id: 'Alojamiento', icon: 'bed', color: '#34C759' },
  { id: 'Otro', icon: 'ellipsis-horizontal', color: '#8E8E93' },
];

const ExpensesScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { activeTrip } = useTrip();
  const { user, userData } = useAuth();

  const [activeTab, setActiveTab] = useState<ExpenseType>('Individual');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [participantPhotos, setParticipantPhotos] = useState<Record<string, string>>({});

  // Modals visibility
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Selection State
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Form State (New & Edit)
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<ExpenseType>('Individual');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Comida');

  useEffect(() => {
    if (!activeTrip?.id) return;

    // Escuchar gastos
    const unsubscribeExpenses = expenseService.subscribeToExpenses(activeTrip.id, (data) => {
      setExpenses(data);
      setLoading(false);
    });

    // Escuchar perfiles de participantes para las fotos
    const { collection, query, where, onSnapshot } = require('firebase/firestore');
    const { db } = require('../services/firebaseConfig');
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('__name__', 'in', activeTrip.participants));

    const unsubscribeUsers = onSnapshot(q, (snapshot: any) => {
      const photos: Record<string, string> = {};
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.photoURL) photos[doc.id] = data.photoURL;
      });
      setParticipantPhotos(photos);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeUsers();
    };
  }, [activeTrip?.id, activeTrip?.participants]);

  const handleAddExpense = async () => {
    if (!formName.trim() || !formAmount || !activeTrip?.id || !user) {
      Alert.alert('Error', 'Por favor, rellena todos los campos');
      return;
    }

    setSubmitting(true);
    try {
      await expenseService.addExpense({
        tripId: activeTrip!.id!,
        userId: user.uid,
        userName: userData?.displayName || user.displayName || 'Viajero',
        userPhoto: userData?.photoURL || user.photoURL || undefined,
        name: formName,
        amount: parseFloat(formAmount.replace(',', '.')),
        date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        category: formCategory,
        type: formType,
      });
      closeAddModal();
    } catch (error) {
      Alert.alert('Error', 'No se pudo añadir el gasto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExpense = async () => {
    if (!formName.trim() || !formAmount || !activeTrip?.id || !selectedExpense?.id) return;

    setSubmitting(true);
    try {
      await expenseService.updateExpense(activeTrip!.id!, selectedExpense.id, {
        name: formName,
        amount: parseFloat(formAmount.replace(',', '.'))
      });
      closeEditModal();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el gasto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!activeTrip?.id || !selectedExpense?.id) return;

    Alert.alert(
      'Eliminar gasto',
      '¿Estás seguro de que quieres borrar este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseService.deleteExpense(activeTrip!.id!, selectedExpense.id!);
              closeEditModal();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el gasto');
            }
          }
        }
      ]
    );
  };

  const openAddModal = () => {
    setFormName('');
    setFormAmount('');
    setFormType(activeTab);
    setFormCategory('Comida');
    setAddModalVisible(true);
  };

  const closeAddModal = () => setAddModalVisible(false);

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormName(expense.name);
    setFormAmount(expense.amount.toString());
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedExpense(null);
  };

  const filteredExpenses = expenses.filter(e => {
    if (activeTab === 'Colectivo') {
      return e.type === 'Colectivo';
    }
    // Si es Individual, solo mostramos los del usuario logueado
    return e.type === 'Individual' && e.userId === user?.uid;
  });
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const getChartData = () => {
    if (filteredExpenses.length === 0) return [];
    
    const dataMap: Record<string, { amount: number, photo?: string, label: string }> = {};
    
    if (activeTab === 'Individual') {
      filteredExpenses.forEach(e => {
        dataMap[e.date] = { 
          amount: (dataMap[e.date]?.amount || 0) + e.amount,
          label: e.date
        };
      });
    } else {
      filteredExpenses.forEach(e => {
        dataMap[e.userId] = { 
          amount: (dataMap[e.userId]?.amount || 0) + e.amount,
          photo: participantPhotos[e.userId] || e.userPhoto, // Prioridad al perfil actual, luego al guardado en el gasto
          label: e.userName
        };
      });
    }

    const values = Object.values(dataMap);
    const max = Math.max(...values.map(v => v.amount), 1);
    
    return values.map((v) => ({
      label: v.label,
      photo: v.photo,
      value: v.amount,
      heightPercentage: (v.amount / max) * 100
    }));
  };

  const chartData = getChartData();

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const categoryInfo = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[4];
    return (
      <TouchableOpacity
        onPress={() => openEditModal(item)}
        style={[styles.expenseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '15' }]}>
          <Ionicons name={categoryInfo.icon} size={22} color={categoryInfo.color} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.expenseMeta, { color: colors.textSecondary }]}>
            {item.category} • {item.date} {activeTab === 'Colectivo' ? `• ${item.userName}` : ''}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.expenseAmount, { color: colors.text }]}>{item.amount.toFixed(2)}€</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gastos</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <LinearGradient colors={[colors.primary, isDark ? '#47a1ff' : '#00C6FF']} style={styles.plusButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <View style={[styles.tabsBg, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
          {(['Individual', 'Colectivo'] as ExpenseType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && [styles.activeTab, { backgroundColor: colors.card }]]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab ? { color: colors.text, fontWeight: '700' } : { color: colors.textSecondary }]}>
                {tab === 'Individual' ? 'Individuales' : 'Colectivos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={item => item.id!}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>{activeTab === 'Individual' ? 'Gasto por Día' : 'Aportación por Persona'}</Text>
                <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>{activeTab === 'Individual' ? 'Total personal' : 'Bote acumulado'}: {totalAmount.toFixed(2)}€</Text>
              </View>
              {chartData.length > 0 ? (
                <View style={styles.chartBarsContainer}>
                  {chartData.map((item, index) => (
                    <View key={index} style={styles.chartBarWrapper}>
                      <Text style={[styles.chartValueText, { color: colors.text }]}>{item.value.toFixed(0)}€</Text>
                      <View style={[styles.chartBarBg, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                        <LinearGradient colors={[colors.primary, isDark ? '#47a1ff' : '#00C6FF']} style={[styles.chartBarFill, { height: `${item.heightPercentage}%` }]} />
                      </View>
                      {activeTab === 'Colectivo' ? (
                        <View style={styles.avatarWrapper}>
                          {item.photo ? (
                            <Image source={{ uri: item.photo }} style={styles.chartAvatar} />
                          ) : (
                            <View style={[styles.chartAvatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                              <Ionicons name="person" size={14} color={colors.textSecondary} />
                            </View>
                          )}
                          <Text style={[styles.chartLabelMini, { color: colors.textSecondary }]} numberOfLines={1}>{item.label}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.chartLabel, { color: colors.textSecondary }]} numberOfLines={1}>{item.label}</Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyChart}><Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>Sin datos aún</Text></View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={60} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 16 }} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Sin gastos registrados</Text>
              <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>Pulsa el botón + para añadir un nuevo gasto</Text>
            </View>
          }
        />
      )}

      {/* MODAL AÑADIR */}
      <Modal visible={addModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nuevo Gasto</Text>
              <TouchableOpacity onPress={closeAddModal}><Ionicons name="close" size={28} color={colors.text} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
              <View style={[styles.typeSelector, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                {(['Individual', 'Colectivo'] as ExpenseType[]).map((type) => (
                  <TouchableOpacity key={type} style={[styles.typeOption, formType === type && { backgroundColor: colors.primary }]} onPress={() => setFormType(type)}>
                    <Text style={[styles.typeText, formType === type ? { color: '#fff' } : { color: colors.textSecondary }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Nombre (ej. Cena)" placeholderTextColor={colors.textSecondary} value={formName} onChangeText={setFormName} />
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Cantidad (€)" placeholderTextColor={colors.textSecondary} value={formAmount} onChangeText={setFormAmount} keyboardType="numeric" />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Categoría</Text>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat.id} style={[styles.categoryOption, formCategory === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '15' }]} onPress={() => setFormCategory(cat.id)}>
                    <Ionicons name={cat.icon} size={24} color={formCategory === cat.id ? cat.color : colors.textSecondary} />
                    <Text style={[styles.categoryLabel, { color: formCategory === cat.id ? cat.color : colors.textSecondary }]}>{cat.id}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={handleAddExpense} disabled={submitting} style={styles.submitButton}>
                <LinearGradient colors={[colors.primary, isDark ? '#47a1ff' : '#00C6FF']} style={styles.submitGradient}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark" size={28} color="#fff" />}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL EDITAR */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, minHeight: '40%', borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Gestionar Gasto</Text>
              <TouchableOpacity onPress={closeEditModal}><Ionicons name="close" size={28} color={colors.text} /></TouchableOpacity>
            </View>
            <View style={styles.form}>
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Nombre" placeholderTextColor={colors.textSecondary} value={formName} onChangeText={setFormName} />
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Cantidad (€)" placeholderTextColor={colors.textSecondary} value={formAmount} onChangeText={setFormAmount} keyboardType="numeric" />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleDeleteExpense} style={[styles.deleteButton, { borderColor: '#FF3B30' }]}>
                  <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateExpense} disabled={submitting} style={styles.updateButton}>
                  <LinearGradient colors={[colors.primary, isDark ? '#47a1ff' : '#00C6FF']} style={styles.updateGradient}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark" size={28} color="#fff" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  iconButton: { width: 44, height: 44, justifyContent: 'center' },
  addButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  plusButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  tabsContainer: { paddingHorizontal: 20, marginBottom: 20 },
  tabsBg: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 14 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  expenseCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  categoryIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 16, fontWeight: '700' },
  expenseMeta: { fontSize: 12, marginTop: 2 },
  amountContainer: { flexDirection: 'row', alignItems: 'center' },
  expenseAmount: { fontSize: 16, fontWeight: '800' },
  chartContainer: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 24 },
  chartHeader: { marginBottom: 20, alignItems: 'center' },
  chartTitle: { fontSize: 17, fontWeight: '800' },
  chartSubtitle: { fontSize: 13, marginTop: 2 },
  chartBarsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 160 },
  chartBarWrapper: { alignItems: 'center', flex: 1 },
  chartValueText: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  chartBarBg: { width: 24, height: 100, borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: 8 },
  chartBarFill: { width: '100%', borderRadius: 12 },
  chartLabel: { fontSize: 11, fontWeight: '600', maxWidth: 50, textAlign: 'center' },
  chartLabelMini: { fontSize: 9, fontWeight: '500', marginTop: 2, maxWidth: 45, textAlign: 'center' },
  avatarWrapper: { alignItems: 'center', marginTop: 4 },
  chartAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#fff' },
  emptyChart: { height: 100, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyStateSub: { fontSize: 14, textAlign: 'center', opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    width: '90%',
    borderRadius: 25,
    padding: 24,
    maxHeight: '85%',
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  form: { gap: 16 },
  typeSelector: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 8 },
  typeOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  typeText: { fontSize: 14, fontWeight: '600' },
  input: { height: 55, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    width: '100%'
  },
  categoryOption: {
    width: (width * 0.9 - 48 - 18) / 3, // Un poco más de margen para asegurar las 3 columnas
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  categoryLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  submitButton: { marginTop: 10 },
  submitGradient: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 24, justifyContent: 'center' },
  deleteButton: { width: 55, height: 55, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  updateButton: { flex: 1, height: 55 },
  updateGradient: { flex: 1, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
});

export default ExpensesScreen;
