import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { tripService, TripPoint } from '../services/tripService';
import { NestableScrollContainer, NestableDraggableFlatList, ScaleDecorator } from 'react-native-draggable-flatlist';

const ItineraryScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip } = useTrip();
  
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
      // Sincronizar orden
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
    <View key={point.id} style={styles.pointCard}>
      <View style={[styles.colorBar, { backgroundColor: point.color }]} />
      <View style={styles.pointInfo}>
        <Text style={styles.pointName} numberOfLines={1}>{point.name}</Text>
        <Text style={styles.pointAddress} numberOfLines={1}>{point.locationName}</Text>
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
            <Ionicons name="reorder-two" size={26} color="#CCC" />
          </View>
          
          <View style={[styles.pointCard, { flex: 1, marginVertical: 0 }]}>
            <View style={[styles.colorBar, { backgroundColor: item.color }]} />
            <View style={styles.pointInfo}>
              <Text style={styles.pointName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.pointAddress} numberOfLines={1}>{item.locationName}</Text>
            </View>
          </View>
          
          <View style={styles.editActionsGroup}>
            <TouchableOpacity onPress={() => handleDuplicate(item)} style={styles.miniIconBtn}>
              <Ionicons name="copy-outline" size={18} color="#0984E3" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.miniIconBtn}>
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
      <View key={`day-${dayIndex}`} style={[styles.daySection, isEditing && styles.editingSection]}>
        <View style={styles.dayHeader}>
          <View style={[styles.dayIcon, { backgroundColor: isUnassigned ? '#33333320' : '#0984E320' }]}>
            {isUnassigned ? (
              <Ionicons name="calendar-outline" size={20} color="#333" />
            ) : (
              <Text style={styles.dayIconText}>{dayIndex}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dayTitle}>{title}</Text>
            <Text style={styles.daySubtitle}>{subtitle}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.dayEditButton, isEditing && styles.daySaveButton]} 
            onPress={() => toggleEditDay(dayIndex)}
          >
            <Ionicons name={isEditing ? "checkmark" : "pencil"} size={22} color={isEditing ? "#FFF" : "#0984E3"} />
          </TouchableOpacity>
        </View>

        <View style={styles.pointsList}>
          {dayPoints.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Vacío. Añade lugares desde el mapa.</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Itinerario</Text>
        <Text style={styles.subtitle}>{activeTrip?.name}</Text>
      </View>

      <NestableScrollContainer style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {points.filter(p => p.dayIndex === 0).length > 0 && 
          renderDaySection("Sin Asignar", "Puntos pendientes", 0, true)
        }
        {tripDays.map((day) => renderDaySection(`Día ${day.index}`, day.dateString, day.index))}
        <View style={{height: 100}} />
      </NestableScrollContainer>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Mapa')}>
        <Ionicons name="map" size={24} color="#FFF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Start')}>
        <Ionicons name="chevron-down" size={28} color="#1C1C1E" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  daySection: {
    marginBottom: 24,
  },
  editingSection: {
    backgroundColor: '#FFF',
    padding: 12,
    marginHorizontal: -12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  dayIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0984E3',
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  daySubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  dayEditButton: {
    padding: 8,
    borderRadius: 20,
  },
  daySaveButton: {
    backgroundColor: '#0984E3',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pointsList: {
    marginLeft: 20,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#EBEBEB',
  },
  pointCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginVertical: 4,
  },
  colorBar: {
    width: 6,
    height: '100%',
  },
  pointInfo: {
    flex: 1,
    padding: 12,
  },
  pointName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pointAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  draggableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  draggableRowActive: {
    opacity: 0.9,
    transform: [{ scale: 1.03 }],
  },
  dragHandle: {
    padding: 8,
  },
  editActionsGroup: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 6,
  },
  miniIconBtn: {
    padding: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
  },
  emptyState: {
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#AAA',
    fontStyle: 'italic',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#F3F3F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0984E3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  }
});

export default ItineraryScreen;
