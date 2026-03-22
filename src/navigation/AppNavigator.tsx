import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import MapScreen from '../screens/MapScreen';
import ItineraryScreen from '../screens/ItineraryScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import VaultScreen from '../screens/VaultScreen';
import StartScreen from '../screens/StartScreen';
import CreateTripScreen from '../screens/CreateTripScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Mapa') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Itinerario') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Gastos') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Documentos') {
            iconName = focused ? 'document-lock' : 'document-lock-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Mapa" component={MapScreen} />
      <Tab.Screen name="Itinerario" component={ItineraryScreen} />
      <Tab.Screen name="Gastos" component={ExpensesScreen} />
      <Tab.Screen name="Documentos" component={VaultScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Start" component={StartScreen} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
