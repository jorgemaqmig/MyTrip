import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { tripService, TripPoint } from '../services/tripService';
import { NestableScrollContainer, NestableDraggableFlatList, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <View key={point.id} style={[styles.pointCard, { backgroundColor: colors.card }]}>
      <View style={[styles.pointDot, { backgroundColor: point.color }]} />
      <View style={styles.pointInfo}>
        <Text style={[styles.pointName, { color: colors.text }]} numberOfLines={1}>{point.name}</Text>
        <View style={styles.pointMeta}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.pointAddress, { color: colors.textSecondary }]} numberOfLines={1}>{point.locationName}</Text>
        </View>
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
          <Ionicons name="reorder-three" size={22} color={isDark ? '#636366' : '#AEAEB2'} style={{ marginRight: 8 }} />
          
          <View style={[styles.pointCard, { flex: 1, backgroundColor: colors.card, borderColor: isActive ? colors.primary : 'transparent', borderWidth: isActive ? 1 : 0 }]}>
            <View style={[styles.pointDot, { backgroundColor: item.color }]} />
            <View style={styles.pointInfo}>
              <Text style={[styles.pointName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <View style={styles.pointMeta}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.pointAddress, { color: colors.textSecondary }]} numberOfLines={1}>{item.locationName}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.editActionsGroup}>
            <TouchableOpacity onPress={() => handleDuplicate(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="copy-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
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
      <View key={`day-${dayIndex}`}>
        {/* Cabecera de día centrada */}
        <View style={styles.daySeparatorBlock}>
          <Text style={[styles.dayTitleText, { color: colors.text }]}>{title}</Text>
          <View style={[styles.daySeparatorLine, { backgroundColor: colors.separator }]} />
          <Text style={[styles.dayDateText, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>

        <View style={[styles.daySection, isEditing && [styles.editingSection, { backgroundColor: isDark ? '#1C1C1E' : '#F9F9FB' }]]}>
          {/* Botón editar alineado a la derecha */}
          <View style={styles.editRow}>
            <TouchableOpacity 
              style={[
                styles.dayEditButton, 
                { backgroundColor: isEditing ? colors.primary : (isDark ? '#2C2C2E' : '#F2F2F7') }
              ]} 
              onPress={() => toggleEditDay(dayIndex)}
            >
              <Ionicons 
                name={isEditing ? "checkmark" : "create-outline"} 
                size={16} 
                color={isEditing ? "#FFF" : colors.textSecondary} 
              />
              <Text style={[styles.editLabel, { color: isEditing ? '#FFF' : colors.textSecondary }]}>
                {isEditing ? 'Guardar' : 'Editar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pointsList}>
            {dayPoints.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sin lugares añadidos</Text>
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
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NestableScrollContainer style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSpacer} />
        
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.flexOne}>
              <Text style={[styles.title, { color: colors.text }]}>Itinerario</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{activeTrip?.name}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
              onPress={() => navigation.navigate('Start')}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {points.filter(p => p.dayIndex === 0).length > 0 && 
          renderDaySection("Sin Asignar", "Puntos pendientes", 0, true)
        }
        {tripDays.map((day) => 
          renderDaySection(`Día ${day.index}`, day.dateString, day.index)
        )}
        <View style={{ height: 120 }} />
      </NestableScrollContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24 },
  topSpacer: { height: 0, marginBottom: 15 },
  headerSection: { marginBottom: 32 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  flexOne: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  closeButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  // --- Cabecera de día centrada ---
  daySeparatorBlock: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  dayTitleText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  daySeparatorLine: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
  },
  dayDateText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
  },

  // --- Secciones de día ---
  daySection: { 
    paddingBottom: 8,
  },
  editingSection: {
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderRadius: 14,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  dayEditButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 16,
    gap: 4,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // --- Tarjetas de lugar ---
  pointsList: { gap: 6 },
  pointCard: { 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pointDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    marginRight: 12,
  },
  pointInfo: { flex: 1 },
  pointName: { fontSize: 15, fontWeight: '600' },
  pointMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3, 
    marginTop: 3,
  },
  pointAddress: { fontSize: 12 },

  // --- Modo edición ---
  draggableRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 3,
  },
  draggableRowActive: { 
    opacity: 0.85, 
    transform: [{ scale: 1.02 }],
  },
  editActionsGroup: { 
    flexDirection: 'row', 
    gap: 14, 
    paddingLeft: 10,
  },

  // --- Estado vacío ---
  emptyState: { paddingVertical: 16 },
  emptyText: { fontSize: 14 },
});

export default ItineraryScreen;
