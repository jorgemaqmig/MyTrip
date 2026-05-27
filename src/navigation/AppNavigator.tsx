import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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
import NotificationsScreen from '../screens/NotificationsScreen';
import AppearanceScreen from '../screens/AppearanceScreen';
import TripSettingsScreen from '../screens/TripSettingsScreen';
import InviteFriendsScreen from '../screens/InviteFriendsScreen';
import ParticipantsScreen from '../screens/ParticipantsScreen';
import ChatScreen from '../screens/ChatScreen';

import { useTheme } from '../context/ThemeContext';
import { useTrip } from '../context/TripContext';

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
      <MoreStack.Screen name="TripSettings" component={TripSettingsScreen} />
      <MoreStack.Screen name="InviteFriends" component={InviteFriendsScreen} />
      <MoreStack.Screen name="Participantes" component={ParticipantsScreen} />
    </MoreStack.Navigator>
  );
};

// Componente de Barra de Navegación Personalizada
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { hasUnreadMessages } = useTrip();
  const rootNavigation = useNavigation<any>();
  
  // Lógica para ocultar la barra en ciertas pantallas
  const currentRoute = state.routes[state.index];
  const routeName = getFocusedRouteNameFromRoute(currentRoute) ?? '';
  
  // 1. Ocultar si estamos en la pestaña "Chat"
  if (currentRoute.name === 'Chat') return null;
  
  // 2. Ocultar si estamos en una sub-pantalla de "Más" (pero no en el menú principal)
  if (currentRoute.name === 'Más' && routeName !== '' && routeName !== 'MoreMain') {
    return null;
  }

  return (
    <View style={styles.tabBarContainer}>
      <LinearGradient
        colors={isDark ? ['rgba(35, 35, 38, 0.95)', 'rgba(28, 28, 30, 0.85)'] : ['rgba(255, 255, 255, 0.95)', 'rgba(240, 240, 245, 0.85)']}
        style={[styles.tabBarGradient, { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)' }]}
      >
        {/* Pestañas Reales */}
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: any;
          if (route.name === 'Mapa') iconName = isFocused ? 'map' : 'map-outline';
          else if (route.name === 'Itinerario') iconName = isFocused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Chat') iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Más') iconName = isFocused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
            >
              <View>
                <Ionicons 
                  name={iconName} 
                  size={24} 
                  color={isFocused ? colors.primary : colors.textSecondary} 
                />
                {(route.name === 'Chat' && hasUnreadMessages) && (
                  <View style={[styles.unreadBadge, { backgroundColor: '#FF3B30' }]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </LinearGradient>
    </View>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      initialRouteName="Mapa"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Mapa" component={MapScreen} />
      <Tab.Screen name="Itinerario" component={ItineraryScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Más" component={MoreStackNavigation} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
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
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 35,
    left: 20,
    right: 20,
    height: 60,
    zIndex: 1000,
  },
  tabBarGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'white', // Un pequeño borde blanco para que resalte
  },
});

export default AppNavigator;
