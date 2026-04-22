import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTrip } from '../context/TripContext';
import { tripService, TripPoint } from '../services/tripService';

const ItineraryScreen = () => {
  const navigation = useNavigation<any>();
  const { activeTrip } = useTrip();
  
  const [points, setPoints] = useState<TripPoint[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPoints = async () => {
    if (!activeTrip?.id) return;
    try {
      const p = await tripService.getTripPoints(activeTrip.id);
      setPoints(p);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPoints();
    }, [activeTrip?.id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPoints();
  };

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
      
      days.push({
        index: dayIndex,
        dateString: dateString
      });
      currentD.setDate(currentD.getDate() + 1);
      dayIndex++;
    }
    return days;
  };

  const tripDays = getTripDays();

  // Group points by day
  const unassignedPoints = points.filter(p => p.dayIndex === 0);
  
  const renderPoint = (point: TripPoint) => (
    <View key={point.id} style={styles.pointCard}>
      <View style={[styles.colorBar, { backgroundColor: point.color }]} />
      <View style={styles.pointInfo}>
        <Text style={styles.pointName} numberOfLines={1}>{point.name}</Text>
        <Text style={styles.pointAddress} numberOfLines={1}>{point.locationName}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Itinerario</Text>
        <Text style={styles.subtitle}>{activeTrip?.name}</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0984E3" />
        }
      >
        {/* Unassigned Points (Only show if there are any) */}
        {unassignedPoints.length > 0 && (
          <View style={styles.daySection}>
            <View style={styles.dayHeader}>
              <View style={[styles.dayIcon, { backgroundColor: '#33333320' }]}>
                <Ionicons name="calendar-outline" size={20} color="#333" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayTitle}>Sin Asignar</Text>
                <Text style={styles.daySubtitle}>Puntos pendientes de organizar</Text>
              </View>
              <TouchableOpacity style={styles.dayEditButton}>
                <Ionicons name="pencil" size={20} color="#0984E3" />
              </TouchableOpacity>
            </View>
            <View style={styles.pointsList}>
              {unassignedPoints.map(renderPoint)}
            </View>
          </View>
        )}

        {/* Assigned Days */}
        {tripDays.map((day) => {
          const dayPoints = points.filter(p => p.dayIndex === day.index);
          
          return (
            <View key={day.index} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayIcon, { backgroundColor: '#0984E320' }]}>
                  <Text style={styles.dayIconText}>{day.index}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayTitle}>Día {day.index}</Text>
                  <Text style={styles.daySubtitle}>{day.dateString}</Text>
                </View>
                <TouchableOpacity style={styles.dayEditButton}>
                  <Ionicons name="pencil" size={20} color="#0984E3" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.pointsList}>
                {dayPoints.length > 0 ? (
                  dayPoints.map(renderPoint)
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Día libre. Explora el mapa para añadir lugares.</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
        
        {/* Espacio final */}
        <View style={{height: 80}} />
      </ScrollView>

      {/* Botón Flotante para ir al Mapa si no saben qué hacer */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('Mapa')}
      >
        <Ionicons name="map" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Botón de volver al inicio temporalmente en la esquina */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('Start')}
      >
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
  },
  pointsList: {
    marginLeft: 20, // Identation for the "timeline" feel
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#EBEBEB',
    gap: 12,
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
    marginBottom: 4,
  },
  pointAddress: {
    fontSize: 12,
    color: '#888',
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
