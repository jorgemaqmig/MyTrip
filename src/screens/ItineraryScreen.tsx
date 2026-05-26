import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { tripService, TripPoint } from '../services/tripService';
import { db } from '../services/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { NestableScrollContainer, NestableDraggableFlatList, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const PREMIUM_PALETTE = [
  '#3B82F6', // Royal Blue
  '#10B981', // Emerald Green
  '#FF6B35', // Orange Coral
  '#8B5CF6', // Purple Orchid
  '#EC4899', // Rose Pink
  '#06B6D4', // Sky Blue
  '#F59E0B', // Golden Honey
  '#EF4444', // Red Fire
];

const DEFAULT_COLORS = PREMIUM_PALETTE;

const ItineraryScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip, setActiveTrip } = useTrip();
  const { colors, isDark } = useTheme();
  
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [editDay, setEditDay] = useState<number | null>(null);
  const [localDayPoints, setLocalDayPoints] = useState<TripPoint[]>([]);
  const [dayColors, setDayColors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (activeTrip?.dayColors) {
      setDayColors(activeTrip.dayColors);
    }
  }, [activeTrip?.dayColors]);

  const getDayColor = (dayIndex: number) => {
    const idxStr = dayIndex.toString();
    if (dayColors[idxStr]) {
      return dayColors[idxStr];
    }
    if (activeTrip?.dayColors && activeTrip.dayColors[idxStr]) {
      return activeTrip.dayColors[idxStr];
    }
    return DEFAULT_COLORS[(dayIndex - 1) % DEFAULT_COLORS.length] || '#3B82F6';
  };

  const handleSelectColor = (dayIndex: number, color: string) => {
    setDayColors(prev => ({
      ...prev,
      [dayIndex.toString()]: color
    }));
  };

  useEffect(() => {
    if (!activeTrip?.id) return;

    const pointsRef = collection(db, 'trips', activeTrip.id, 'points');
    const unsubscribe = onSnapshot(pointsRef, (snapshot) => {
      const pList: TripPoint[] = [];
      snapshot.forEach((docSnap) => {
        pList.push({ id: docSnap.id, ...docSnap.data() } as TripPoint);
      });
      pList.sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return a.order - b.order;
      });
      setPoints(pList);
    }, (error) => {
      console.error("Error listening to points: ", error);
    });

    return () => unsubscribe();
  }, [activeTrip?.id]);

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
      // 1. Guardar orden de puntos
      for (let i = 0; i < localDayPoints.length; i++) {
        const p = localDayPoints[i];
        if (p.order !== i + 1) {
          await tripService.updateTripPoint(activeTrip.id, p.id!, { order: i + 1 });
        }
      }

      // 2. Guardar color de día
      const updatedDayColors = {
        ...(activeTrip.dayColors || {}),
        ...dayColors
      };

      await tripService.updateTrip(activeTrip.id, {
        dayColors: updatedDayColors
      });

      // 3. Actualizar contexto
      setActiveTrip({
        ...activeTrip,
        dayColors: updatedDayColors
      });
    } catch (error) {
      Alert.alert('Error', 'No se guardaron los cambios en el servidor.');
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
  const renderNormalPoint = (point: TripPoint, index: number, total: number) => {
    const dayColor = getDayColor(point.dayIndex);
    return (
      <View key={point.id} style={styles.pointContainer}>
        {/* Timeline Left Column */}
        <View style={styles.timelineLeft}>
          <View style={[styles.pointDotCircle, { borderColor: dayColor, backgroundColor: colors.background }]}>
            <View style={[styles.pointDotInner, { backgroundColor: dayColor }]} />
          </View>
          {index < total - 1 && (
            <View style={[styles.timelineVerticalLine, { backgroundColor: dayColor + '40' }]} />
          )}
        </View>
        
        {/* Destination Card Content */}
        <View style={[styles.pointCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.pointInfo}>
            <Text style={[styles.pointName, { color: colors.text }]} numberOfLines={1}>{point.name}</Text>
            <View style={styles.pointMeta}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.pointAddress, { color: colors.textSecondary }]} numberOfLines={1}>{point.locationName}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderDraggablePoint = ({ item, drag, isActive, index }: any) => {
    const dayColor = getDayColor(item.dayIndex);
    return (
      <ScaleDecorator>
        <TouchableOpacity 
          activeOpacity={1} 
          onLongPress={drag} 
          disabled={isActive}
          style={[styles.draggableRow, isActive && styles.draggableRowActive]}
        >
          {/* Reorder drag handle */}
          <View style={styles.dragHandle}>
            <Ionicons name="reorder-three" size={24} color={isDark ? '#636366' : '#AEAEB2'} />
          </View>
          
          {/* Timeline column */}
          <View style={styles.timelineLeft}>
            <View style={[styles.pointDotCircle, { borderColor: dayColor, backgroundColor: colors.background }]}>
              <View style={[styles.pointDotInner, { backgroundColor: dayColor }]} />
            </View>
            <View style={[styles.timelineVerticalLine, { backgroundColor: dayColor + '25' }]} />
          </View>

          {/* Content card */}
          <View style={[styles.pointCard, { flex: 1, backgroundColor: colors.card, borderColor: isActive ? colors.primary : colors.border, borderWidth: 1 }]}>
            <View style={styles.pointInfo}>
              <Text style={[styles.pointName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <View style={styles.pointMeta}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.pointAddress, { color: colors.textSecondary }]} numberOfLines={1}>{item.locationName}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.editActionsGroup}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => handleDuplicate(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="copy-outline" size={15} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3B3015' }]} onPress={() => handleDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={15} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const renderDayHeader = (title: string, subtitle: string, dayIndex: number) => {
    const dayColor = getDayColor(dayIndex);
    const isEditing = editDay === dayIndex;
    
    return (
      <View style={[styles.dayHeaderCard, { borderColor: dayColor + '30', backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
        <View style={[styles.dayHeaderAccent, { backgroundColor: dayColor }]} />
        <View style={styles.dayHeaderTextWrap}>
          <Text style={[styles.dayTitleText, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.dayDateText, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.dayEditButton, 
            { 
              backgroundColor: isEditing ? colors.primary : (isDark ? '#2C2C2E' : '#FFFFFF'), 
              borderColor: isEditing ? colors.primary : colors.border, 
              borderWidth: 1 
            }
          ]} 
          onPress={() => toggleEditDay(dayIndex)}
        >
          <Ionicons 
            name={isEditing ? "checkmark" : "create-outline"} 
            size={15} 
            color={isEditing ? "#FFF" : colors.textSecondary} 
          />
          <Text style={[styles.editLabel, { color: isEditing ? '#FFF' : colors.textSecondary }]}>
            {isEditing ? 'Guardar' : 'Editar'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDaySection = (title: string, subtitle: string, dayIndex: number, isUnassigned = false) => {
    const isEditing = editDay === dayIndex;
    const dayPoints = isEditing ? localDayPoints : points.filter(p => p.dayIndex === dayIndex).sort((a,b) => a.order - b.order);

    return (
      <View key={`day-${dayIndex}`} style={styles.daySectionContainer}>
        {renderDayHeader(title, subtitle, dayIndex)}

        <View style={[styles.daySection, isEditing && [styles.editingSection, { backgroundColor: isDark ? '#1C1C1E' : '#F9F9FB', borderColor: colors.border, borderWidth: 1 }]]}>
          {isEditing && (
            <View style={[styles.colorPickerContainer, { borderColor: colors.border }]}>
              <Text style={[styles.colorPickerTitle, { color: colors.textSecondary }]}>Color del Día</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPalette}>
                {PREMIUM_PALETTE.map((color) => {
                  const isSelected = (dayColors[dayIndex.toString()] || getDayColor(dayIndex)) === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorSwatch, { backgroundColor: color, borderColor: isSelected ? colors.text : 'transparent', borderWidth: isSelected ? 2 : 0 }]}
                      onPress={() => handleSelectColor(dayIndex, color)}
                      activeOpacity={0.8}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.pointsList}>
            {dayPoints.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={24} color={colors.textSecondary} style={{ marginBottom: 6, opacity: 0.6 }} />
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
              dayPoints.map((p, idx) => renderNormalPoint(p, idx, dayPoints.length))
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
  scrollContent: { padding: 20 },
  topSpacer: { height: 0, marginBottom: 5 },
  headerSection: { marginBottom: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  flexOne: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16 },
  closeButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  // --- Secciones de día ---
  daySectionContainer: {
    marginBottom: 20,
  },
  dayHeaderCard: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dayHeaderAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  dayHeaderTextWrap: {
    flex: 1,
    marginLeft: 8,
  },
  dayTitleText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  dayDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dayEditButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12,
    gap: 4,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  daySection: { 
    paddingTop: 10,
  },
  editingSection: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    borderStyle: 'dashed',
  },

  // --- Selector de color ---
  colorPickerContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  colorPickerTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  colorPalette: {
    paddingVertical: 2,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // --- Destinos y Línea de tiempo ---
  pointsList: { 
    gap: 0,
  },
  pointContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
    position: 'relative',
    marginRight: 4,
  },
  pointDotCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    zIndex: 2,
  },
  pointDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineVerticalLine: {
    position: 'absolute',
    top: 30,
    bottom: -15, // Cruza hacia el siguiente punto
    width: 2,
    left: 15,
    zIndex: 1,
  },
  pointCard: { 
    flex: 1,
    borderRadius: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  pointInfo: { flex: 1 },
  pointName: { fontSize: 15, fontWeight: '600' },
  pointMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3, 
    marginTop: 4,
  },
  pointAddress: { fontSize: 12 },

  // --- Modo edición ---
  draggableRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8,
  },
  draggableRowActive: { 
    opacity: 0.85, 
  },
  dragHandle: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  editActionsGroup: { 
    flexDirection: 'row', 
    gap: 8, 
    paddingLeft: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Estado vacío ---
  emptyState: { 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: { 
    fontSize: 13,
    fontWeight: '500',
  },
});

export default ItineraryScreen;
