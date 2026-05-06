import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { tripService, TripPoint } from '../services/tripService';
import { NestableScrollContainer, NestableDraggableFlatList, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const ItineraryScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip } = useTrip();
  const { colors, isDark } = useTheme();
  
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [editDay, setEditDay] = useState<number | null>(null);
  const [localDayPoints, setLocalDayPoints] = useState<TripPoint[]>([]);

  const fetchPoints = async () => {
    if (!activeTrip?.id) return;
    try {
      const p = await tripService.getTripPoints(activeTrip.id);
      setPoints(p);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPoints();
    }, [activeTrip?.id])
  );

  const getTripDays = () => {
    if (!activeTrip?.startDate || !activeTrip?.endDate) return [];
    const startParts = activeTrip.startDate.split('-');
    const endParts = activeTrip.endDate.split('-');
    const startD = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    const endD = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
    
    const days = [];
    let currentD = new Date(startD);
    let dayIndex = 1;
    while (currentD <= endD) {
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      const dateString = `${currentD.getDate()} ${months[currentD.getMonth()]}`;
      days.push({ index: dayIndex, dateString: dateString });
      currentD.setDate(currentD.getDate() + 1);
      dayIndex++;
    }
    return days;
  };

  const tripDays = getTripDays();

  // --- EDIT MODE LOGIC ---
  const toggleEditDay = (dayIndex: number) => {
    if (editDay === dayIndex) {
      handleSaveOrder(dayIndex);
    } else {
      setEditDay(dayIndex);
      setLocalDayPoints(points.filter(p => p.dayIndex === dayIndex).sort((a,b) => a.order - b.order));
    }
  };

  const handleSaveOrder = async (dayIndex: number) => {
    setEditDay(null);
    setPoints(prev => [
      ...prev.filter(p => p.dayIndex !== dayIndex),
      ...localDayPoints
    ]);

    if (!activeTrip?.id) return;

    try {
      for (let i = 0; i < localDayPoints.length; i++) {
        const p = localDayPoints[i];
        if (p.order !== i + 1) {
          await tripService.updateTripPoint(activeTrip.id, p.id!, { order: i + 1 });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se guardó el orden en el servidor.');
    }
  };

  const handleDelete = (pointId: string) => {
    Alert.alert('Eliminar', '¿Quitar sitio?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          if (!activeTrip?.id) return;
          setLocalDayPoints(prev => prev.filter(p => p.id !== pointId));
          try {
            await tripService.deleteTripPoint(activeTrip.id, pointId);
          } catch (e) {}
      }}
    ]);
  };

  const handleDuplicate = async (point: TripPoint) => {
    if (!activeTrip?.id) return;
    const newPoint = { ...point, order: localDayPoints.length + 1 };
    delete newPoint.id;
    const tempId = `temp_${Date.now()}`;
    setLocalDayPoints(prev => [...prev, { ...newPoint, id: tempId }]);

    try {
      const realId = await tripService.addPointToTrip(activeTrip.id, newPoint);
      setLocalDayPoints(prev => prev.map(p => p.id === tempId ? { ...p, id: realId } : p));
    } catch (e) {
      Alert.alert('Error', 'Fallo al duplicar.');
    }
  };

  // --- RENDERERS ---
  const renderNormalPoint = (point: TripPoint) => (
    <View key={point.id} style={[styles.pointCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.colorBar, { backgroundColor: point.color }]} />
      <View style={styles.pointInfo}>
        <Text style={[styles.pointName, { color: colors.text }]} numberOfLines={1}>{point.name}</Text>
        <Text style={[styles.pointAddress, { color: colors.textSecondary }]} numberOfLines={1}>{point.locationName}</Text>
      </View>
    </View>
  );

  const renderDraggablePoint = ({ item, drag, isActive }: any) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity 
          activeOpacity={1} 
          onLongPress={drag} 
          disabled={isActive}
          style={[styles.draggableRow, isActive && styles.draggableRowActive]}
        >
          <View style={styles.dragHandle}>
            <Ionicons name="reorder-two" size={26} color={isDark ? '#48484A' : '#CCC'} />
          </View>
          
          <View style={[styles.pointCard, { flex: 1, marginVertical: 0, backgroundColor: colors.card, borderColor: isActive ? colors.primary : colors.border }]}>
            <View style={[styles.colorBar, { backgroundColor: item.color }]} />
            <View style={styles.pointInfo}>
              <Text style={[styles.pointName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.pointAddress, { color: colors.textSecondary }]} numberOfLines={1}>{item.locationName}</Text>
            </View>
          </View>
          
          <View style={styles.editActionsGroup}>
            <TouchableOpacity onPress={() => handleDuplicate(item)} style={[styles.miniIconBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F8F8F8' }]}>
              <Ionicons name="copy-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.miniIconBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F8F8F8' }]}>
              <Ionicons name="trash-outline" size={18} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const renderDaySection = (title: string, subtitle: string, dayIndex: number, isUnassigned = false) => {
    const isEditing = editDay === dayIndex;
    const dayPoints = isEditing ? localDayPoints : points.filter(p => p.dayIndex === dayIndex).sort((a,b) => a.order - b.order);

    return (
      <View key={`day-${dayIndex}`} style={[styles.daySection, isEditing && [styles.editingSection, { backgroundColor: colors.card }]]}>
        <View style={styles.dayHeader}>
          <View style={[styles.dayIcon, { backgroundColor: isUnassigned ? (isDark ? '#2C2C2E' : '#F2F2F7') : colors.primary + '15' }]}>
            {isUnassigned ? (
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            ) : (
              <Text style={[styles.dayIconText, { color: colors.primary }]}>{dayIndex}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dayTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.daySubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.dayEditButton, isEditing && [styles.daySaveButton, { backgroundColor: colors.primary }]]} 
            onPress={() => toggleEditDay(dayIndex)}
          >
            <Ionicons name={isEditing ? "checkmark" : "pencil"} size={22} color={isEditing ? "#FFF" : colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.pointsList, { borderLeftColor: isDark ? '#2C2C2E' : '#EBEBEB' }]}>
          {dayPoints.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Vacío. Añade lugares desde el mapa.</Text>
            </View>
          ) : isEditing ? (
            <NestableDraggableFlatList
              data={dayPoints}
              renderItem={renderDraggablePoint}
              keyExtractor={(item) => item.id!}
              onDragEnd={({ data }) => setLocalDayPoints(data)}
            />
          ) : (
            dayPoints.map(renderNormalPoint)
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.separator }]}>
        <Text style={[styles.title, { color: colors.text }]}>Itinerario</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{activeTrip?.name}</Text>
      </View>

      <NestableScrollContainer style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {points.filter(p => p.dayIndex === 0).length > 0 && 
          renderDaySection("Sin Asignar", "Puntos pendientes", 0, true)
        }
        {tripDays.map((day) => renderDaySection(`Día ${day.index}`, day.dateString, day.index))}
        <View style={{height: 100}} />
      </NestableScrollContainer>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        onPress={() => navigation.navigate('Mapa')}
      >
        <Ionicons name="map" size={24} color="#FFF" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: isDark ? '#2C2C2E' : '#F3F3F3' }]} 
        onPress={() => navigation.navigate('Start')}
      >
        <Ionicons name="chevron-down" size={28} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 16, marginTop: 4 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24 },
  daySection: { marginBottom: 24 },
  editingSection: {
    padding: 12,
    marginHorizontal: -12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  dayIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dayIconText: { fontSize: 16, fontWeight: '800' },
  dayTitle: { fontSize: 22, fontWeight: '700' },
  daySubtitle: { fontSize: 13, marginTop: 2 },
  dayEditButton: { padding: 8, borderRadius: 20 },
  daySaveButton: { paddingHorizontal: 16, paddingVertical: 8 },
  pointsList: { marginLeft: 20, paddingLeft: 20, borderLeftWidth: 2 },
  pointCard: { borderRadius: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, borderWidth: 1, marginVertical: 4 },
  colorBar: { width: 6, height: '100%' },
  pointInfo: { flex: 1, padding: 12 },
  pointName: { fontSize: 16, fontWeight: '600' },
  pointAddress: { fontSize: 12, marginTop: 2 },
  draggableRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  draggableRowActive: { opacity: 0.9, transform: [{ scale: 1.03 }] },
  dragHandle: { padding: 8 },
  editActionsGroup: { flexDirection: 'row', gap: 6, paddingLeft: 6 },
  miniIconBtn: { padding: 8, borderRadius: 15 },
  emptyState: { paddingVertical: 12 },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 55 : 35, right: 20, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 }
});

export default ItineraryScreen;
