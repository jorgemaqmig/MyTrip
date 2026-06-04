import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, ActivityIndicator } from 'react-native';
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
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface TransitStep {
  instruction: string;
  mode: string;
  duration: string;
  distance: string;
  transitLineName?: string;
  transitLineShortName?: string;
  transitLineColor?: string;
  transitVehicleType?: string;
  transitVehicleName?: string;
  numStops?: number;
  departureStop?: string;
  arrivalStop?: string;
}

interface TransportInfo {
  mode: string;
  icon: string;
  duration: string;
  distance: string;
  polyline: { latitude: number; longitude: number }[];
  steps?: TransitStep[];
}

// Decodificador de polylines de Google (formato encoded)
const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
];

const ItineraryScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip, setActiveTrip } = useTrip();
  const { colors, isDark } = useTheme();
  
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [editDay, setEditDay] = useState<number | null>(null);
  const [localDayPoints, setLocalDayPoints] = useState<TripPoint[]>([]);
  const [dayColors, setDayColors] = useState<{ [key: string]: string }>({});
  const [expandedRoutes, setExpandedRoutes] = useState<{ [key: string]: boolean }>({});
  const [routeCache, setRouteCache] = useState<{ [key: string]: TransportInfo[] }>({});
  const [loadingRoutes, setLoadingRoutes] = useState<{ [key: string]: boolean }>({});
  const [selectedModes, setSelectedModes] = useState<{ [key: string]: number }>({});

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

  // --- TRANSPORT DIRECTIONS ---
  const fetchTransportInfo = async (from: TripPoint, to: TripPoint): Promise<TransportInfo[]> => {
    const modes = [
      { apiMode: 'walking', label: 'Andando', icon: 'walk-outline' },
      { apiMode: 'transit', label: 'Transporte', icon: 'bus-outline' },
      { apiMode: 'driving', label: 'Coche', icon: 'car-outline' },
    ];
    const results: TransportInfo[] = [];
    for (const m of modes) {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&mode=${m.apiMode}&language=es&key=${GOOGLE_MAPS_API_KEY}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.routes && data.routes.length > 0) {
          const leg = data.routes[0].legs[0];
          const encodedPoly = data.routes[0].overview_polyline?.points || '';
          const decoded = encodedPoly ? decodePolyline(encodedPoly) : [];
          
          const parsedSteps: TransitStep[] = [];
          if (leg.steps) {
            for (const s of leg.steps) {
              const step: TransitStep = {
                instruction: s.html_instructions ? s.html_instructions.replace(/<[^>]*>/g, '') : '',
                mode: s.travel_mode || '',
                duration: s.duration?.text || '',
                distance: s.distance?.text || '',
              };
              if (s.travel_mode === 'TRANSIT' && s.transit_details) {
                const td = s.transit_details;
                step.transitLineName = td.line?.name || '';
                step.transitLineShortName = td.line?.short_name || '';
                step.transitLineColor = td.line?.color || '';
                step.transitVehicleType = td.line?.vehicle?.type || '';
                step.transitVehicleName = td.line?.vehicle?.name || '';
                step.numStops = td.num_stops || 0;
                step.departureStop = td.departure_stop?.name || '';
                step.arrivalStop = td.arrival_stop?.name || '';
              }
              parsedSteps.push(step);
            }
          }

          results.push({ 
            mode: m.label, 
            icon: m.icon, 
            duration: leg.duration.text, 
            distance: leg.distance.text, 
            polyline: decoded,
            steps: parsedSteps
          });
        } else {
          results.push({ mode: m.label, icon: m.icon, duration: 'No disponible', distance: '-', polyline: [] });
        }
      } catch (e) {
        results.push({ mode: m.label, icon: m.icon, duration: 'Error', distance: '-', polyline: [] });
      }
    }
    return results;
  };

  const handleToggleRoute = async (from: TripPoint, to: TripPoint) => {
    const key = `${from.id}_${to.id}`;
    if (expandedRoutes[key]) {
      setExpandedRoutes(prev => ({ ...prev, [key]: false }));
      return;
    }
    setExpandedRoutes(prev => ({ ...prev, [key]: true }));
    if (routeCache[key]) return;
    setLoadingRoutes(prev => ({ ...prev, [key]: true }));
    const info = await fetchTransportInfo(from, to);
    setRouteCache(prev => ({ ...prev, [key]: info }));
    setLoadingRoutes(prev => ({ ...prev, [key]: false }));
  };

  // --- RENDERERS ---
  const renderNormalPoint = (point: TripPoint, index: number, total: number) => {
    const dayColor = getDayColor(point.dayIndex);
    return (
      <View key={point.id} style={styles.pointContainer}>
        {/* Timeline Left Column */}
        <View style={styles.timelineLeft}>
          {index > 0 && (
            <View style={[styles.timelineLineUp, { backgroundColor: dayColor + '40' }]} />
          )}
          <View style={[styles.pointDotCircle, { borderColor: dayColor, backgroundColor: colors.background }]}>
            <View style={[styles.pointDotInner, { backgroundColor: dayColor }]} />
          </View>
          {index < total - 1 && (
            <View style={[styles.timelineLineDown, { backgroundColor: dayColor + '40' }]} />
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

  const renderTransportConnector = (fromPoint: TripPoint, toPoint: TripPoint, dayColor: string) => {
    const routeKey = `${fromPoint.id}_${toPoint.id}`;
    const isExpanded = expandedRoutes[routeKey] || false;
    const isLoading = loadingRoutes[routeKey] || false;
    const info = routeCache[routeKey];
    const selectedIdx = selectedModes[routeKey] ?? 0;
    const selectedRoute = info?.[selectedIdx];
    const steps = selectedRoute?.steps || [];

    const midLat = (fromPoint.latitude + toPoint.latitude) / 2;
    const midLng = (fromPoint.longitude + toPoint.longitude) / 2;
    const deltaLat = Math.abs(fromPoint.latitude - toPoint.latitude) * 1.6 || 0.01;
    const deltaLng = Math.abs(fromPoint.longitude - toPoint.longitude) * 1.6 || 0.01;

    return (
      <View key={`route-${routeKey}`} style={styles.transportRow}>
        {/* Timeline column */}
        <View style={styles.transportTimelineCol}>
          <View style={[styles.transportFullLine, { backgroundColor: dayColor + '40' }]} />
          <TouchableOpacity
            style={[styles.transportBtn, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: dayColor + '50' }]}
            onPress={() => handleToggleRoute(fromPoint, toPoint)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'navigate-outline'}
              size={12}
              color={dayColor}
            />
          </TouchableOpacity>
        </View>
        {/* Content column */}
        <View style={styles.transportContentCol}>
          {isExpanded && (
            <View style={[styles.transportCard, { backgroundColor: isDark ? '#1C1C1E' : '#F9F9FB', borderColor: colors.border }]}>
              {isLoading ? (
                <View style={styles.transportLoadingWrap}>
                  <ActivityIndicator size="small" color={dayColor} />
                  <Text style={[styles.transportLoadingText, { color: colors.textSecondary }]}>Calculando rutas...</Text>
                </View>
              ) : info ? (
                <>
                  {/* Mini Map */}
                  <View style={styles.miniMapContainer}>
                    <MapView
                      provider={PROVIDER_GOOGLE}
                      style={styles.miniMap}
                      customMapStyle={isDark ? darkMapStyle : []}
                      initialRegion={{
                        latitude: midLat,
                        longitude: midLng,
                        latitudeDelta: deltaLat,
                        longitudeDelta: deltaLng,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      rotateEnabled={false}
                      pitchEnabled={false}
                      toolbarEnabled={false}
                      mapPadding={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      {/* Route polyline */}
                      {selectedRoute && selectedRoute.polyline.length > 0 && (
                        <Polyline
                          coordinates={selectedRoute.polyline}
                          strokeColor={dayColor}
                          strokeWidth={3}
                        />
                      )}
                      {/* Origin marker */}
                      <Marker
                        coordinate={{ latitude: fromPoint.latitude, longitude: fromPoint.longitude }}
                        pinColor={dayColor}
                      />
                      {/* Destination marker */}
                      <Marker
                        coordinate={{ latitude: toPoint.latitude, longitude: toPoint.longitude }}
                        pinColor={dayColor}
                      />
                    </MapView>
                    {/* Mode label overlay */}
                    <View style={[styles.miniMapBadge, { backgroundColor: dayColor }]}>
                      <Ionicons name={(selectedRoute?.icon || 'walk-outline') as any} size={10} color="#FFF" />
                      <Text style={styles.miniMapBadgeText}>{selectedRoute?.duration || ''}</Text>
                    </View>
                  </View>
                  {/* Transport mode rows */}
                  {info.map((route, idx) => {
                    const isSelected = idx === selectedIdx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.transportInfoRow,
                          isSelected && { backgroundColor: dayColor + '12' },
                          idx < info.length - 1 && { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setSelectedModes(prev => ({ ...prev, [routeKey]: idx }))}
                      >
                        <View style={[styles.transportIconCircle, { backgroundColor: isSelected ? dayColor + '25' : dayColor + '10' }]}>
                          <Ionicons name={route.icon as any} size={14} color={dayColor} />
                        </View>
                        <Text style={[styles.transportModeName, { color: colors.text, fontWeight: isSelected ? '700' : '500' }]}>{route.mode}</Text>
                        <View style={styles.transportMetrics}>
                          <Text style={[styles.transportDuration, { color: isSelected ? dayColor : colors.text }]}>{route.duration}</Text>
                          <Text style={[styles.transportDistance, { color: colors.textSecondary }]}>{route.distance}</Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.transportSelectedDot, { backgroundColor: dayColor }]} />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {/* Detalle del trayecto paso a paso */}
                  {steps.length > 0 && (
                    <View style={[styles.stepsContainer, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                      <Text style={[styles.stepsTitle, { color: colors.textSecondary }]}>Detalles de la ruta</Text>
                      {steps.map((step, sIdx) => {
                        let stepIcon = 'walk-outline';
                        let stepColor = dayColor;
                        if (step.mode === 'TRANSIT') {
                          if (step.transitVehicleType === 'SUBWAY') {
                            stepIcon = 'subway-outline';
                          } else if (step.transitVehicleType === 'BUS') {
                            stepIcon = 'bus-outline';
                          } else if (step.transitVehicleType === 'HEAVY_RAIL') {
                            stepIcon = 'train-outline';
                          } else {
                            stepIcon = 'bus-outline';
                          }
                          if (step.transitLineColor) {
                            stepColor = step.transitLineColor;
                          }
                        } else if (step.mode === 'DRIVING') {
                          stepIcon = 'car-outline';
                        }

                        return (
                          <View key={sIdx} style={styles.stepRow}>
                            {/* Step Timeline Column */}
                            <View style={styles.stepTimelineCol}>
                              <View style={[styles.stepDot, { backgroundColor: stepColor }]} />
                              {sIdx < steps.length - 1 && (
                                <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
                              )}
                            </View>
                            {/* Step Info Column */}
                            <View style={styles.stepInfoCol}>
                              <View style={styles.stepHeaderRow}>
                                <Ionicons name={stepIcon as any} size={13} color={stepColor} style={{ marginRight: 6 }} />
                                {step.mode === 'TRANSIT' && step.transitLineShortName ? (
                                  <View style={[styles.transitBadge, { backgroundColor: stepColor }]}>
                                    <Text style={styles.transitBadgeText}>{step.transitLineShortName}</Text>
                                  </View>
                                ) : null}
                                <Text style={[styles.stepDuration, { color: colors.textSecondary }]}>
                                  {step.duration} ({step.distance})
                                </Text>
                              </View>
                              
                              <Text style={[styles.stepInstruction, { color: colors.text }]}>
                                {step.instruction}
                              </Text>

                              {step.mode === 'TRANSIT' && (
                                <View style={[styles.transitDetailsCard, { backgroundColor: isDark ? '#2C2C2E' : '#EFEFF4' }]}>
                                  <Text style={[styles.transitDetailText, { color: colors.text }]}>
                                    <Text style={{ fontWeight: 'bold' }}>{step.transitVehicleName || 'Transporte'} {step.transitLineName || ''}</Text>
                                  </Text>
                                  <Text style={[styles.transitDetailSub, { color: colors.textSecondary }]}>
                                    Subir: {step.departureStop}
                                  </Text>
                                  <Text style={[styles.transitDetailSub, { color: colors.textSecondary }]}>
                                    Bajar: {step.arrivalStop} ({step.numStops} {step.numStops === 1 ? 'parada' : 'paradas'})
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              ) : null}
            </View>
          )}
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
              dayPoints.map((p, idx) => (
                <React.Fragment key={p.id}>
                  {renderNormalPoint(p, idx, dayPoints.length)}
                  {idx < dayPoints.length - 1 && renderTransportConnector(p, dayPoints[idx + 1], getDayColor(p.dayIndex))}
                </React.Fragment>
              ))
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
    marginTop: 24,
    zIndex: 2,
  },
  pointDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineVerticalLine: {
    position: 'absolute',
    top: 38,
    bottom: -15,
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
    marginBottom: 6,
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

  // --- Timeline connectors ---
  timelineLineUp: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 24,
    left: 15,
    zIndex: 1,
  },
  timelineLineDown: {
    position: 'absolute',
    top: 38,
    bottom: 0,
    width: 2,
    left: 15,
    zIndex: 1,
  },

  // --- Transport connector ---
  transportRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  transportTimelineCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 4,
  },
  transportFullLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    left: 15,
    zIndex: 1,
  },
  transportBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    zIndex: 2,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  transportContentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  transportCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 2,
  },
  transportLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  transportLoadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transportInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  transportIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transportModeName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  transportMetrics: {
    alignItems: 'flex-end',
  },
  transportDuration: {
    fontSize: 13,
    fontWeight: '700',
  },
  transportDistance: {
    fontSize: 11,
    marginTop: 1,
  },
  transportSelectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },

  // --- Mini Map ---
  miniMapContainer: {
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
  },
  miniMapBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  miniMapBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

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

  // --- Paso a paso de ruta ---
  stepsContainer: {
    padding: 12,
  },
  stepsTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepTimelineCol: {
    width: 16,
    alignItems: 'center',
    position: 'relative',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    zIndex: 2,
  },
  stepLine: {
    position: 'absolute',
    top: 12,
    bottom: -8,
    width: 1.5,
    left: 7.25,
    zIndex: 1,
  },
  stepInfoCol: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 16,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transitBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 6,
  },
  transitBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  stepDuration: {
    fontSize: 11,
  },
  stepInstruction: {
    fontSize: 12,
    lineHeight: 16,
  },
  transitDetailsCard: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  transitDetailText: {
    fontSize: 12,
  },
  transitDetailSub: {
    fontSize: 11,
    marginTop: 2,
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
