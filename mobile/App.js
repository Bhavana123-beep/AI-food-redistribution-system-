import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DonorDashboardScreen from './src/screens/DonorDashboardScreen';
import NgoDashboardScreen from './src/screens/NgoDashboardScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LiveTrackingScreen from './src/screens/LiveTrackingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Auth Stack (not logged in) ─────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ─── Donor Tabs ─────────────────────────────────────────────────
function DonorTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: { paddingBottom: 5, height: 60 },
      tabBarIcon: ({ color, size }) => {
        const icons = {
          Dashboard: 'grid-outline', Tracking: 'map-outline',
          History: 'time-outline', Notifications: 'notifications-outline',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}>
      <Tab.Screen name="Dashboard" component={DonorDashboardScreen} />
      <Tab.Screen name="Tracking" component={LiveTrackingScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  );
}

// ─── NGO Tabs ───────────────────────────────────────────────────
function NgoTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: { paddingBottom: 5, height: 60 },
      tabBarIcon: ({ color, size }) => {
        const icons = { Dashboard: 'list-outline', Tracking: 'map-outline', Notifications: 'notifications-outline' };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}>
      <Tab.Screen name="Dashboard" component={NgoDashboardScreen} />
      <Tab.Screen name="Tracking" component={LiveTrackingScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  );
}

// ─── Root: switches stacks based on role ────────────────────────
function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) return <AuthStack />;

  const role = user.role;
  if (role === 'ngo') return <NgoTabs />;
  // donor, restaurant, household → Donor tabs
  return <DonorTabs />;
}

// ─── Entry point ─────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
