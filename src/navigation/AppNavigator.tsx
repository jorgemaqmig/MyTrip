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
import JoinTripScreen from '../screens/JoinTripScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MoreScreen from '../screens/MoreScreen';
import SocialScreen from '../screens/SocialScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MyTripsScreen from '../screens/MyTripsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import EditEmailScreen from '../screens/EditEmailScreen';
import SecurityScreen from '../screens/SecurityScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

// Stack para la pestaña "Más"
const MoreStackNavigation = () => {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreMain" component={MoreScreen} />
      <MoreStack.Screen name="Gastos" component={ExpensesScreen} />
      <MoreStack.Screen name="Documentos" component={VaultScreen} />
    </MoreStack.Navigator>
  );
};

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
          } else if (route.name === 'Más') {
            iconName = focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
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
      <Tab.Screen name="Más" component={MoreStackNavigation} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Start" component={StartScreen} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
      <Stack.Screen name="JoinTrip" component={JoinTripScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Social" component={SocialScreen} />
      <Stack.Screen name="MyTrips" component={MyTripsScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="EditEmail" component={EditEmailScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
