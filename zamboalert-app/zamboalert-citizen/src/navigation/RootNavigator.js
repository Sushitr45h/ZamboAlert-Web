import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';

import WelcomeScreen  from '../screens/auth/WelcomeScreen';
import LoginScreen    from '../screens/auth/LoginScreen';
import SignUpScreen   from '../screens/auth/SignUpScreen';

import SOSScreen      from '../screens/SOSScreen';
import StatusScreen   from '../screens/StatusScreen';
import LogScreen      from '../screens/LogScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RescuerPlaceholderScreen from '../screens/RescuerPlaceholderScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  SOS:      { active: 'warning',   inactive: 'warning-outline' },
  Status:   { active: 'bluetooth', inactive: 'bluetooth-outline' },
  Log:      { active: 'time',      inactive: 'time-outline' },
  Settings: { active: 'settings',  inactive: 'settings-outline' },
};

function CitizenTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? icons.active : icons.inactive}
                size={20}
                color={focused ? colors.primary : colors.textMuted}
              />
            </View>
          );
        },
        tabBarLabel: ({ focused }) => (
          <Text style={[typography.tabLabel, { color: focused ? colors.primary : colors.textMuted }]}>
            {route.name}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="SOS"      component={SOSScreen} />
      <Tab.Screen name="Status"   component={StatusScreen} />
      <Tab.Screen name="Log"      component={LogScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ title: 'Get Started' }} />
      <Stack.Screen name="Login"   component={LoginScreen}   options={{ title: 'Login' }} />
      <Stack.Screen name="SignUp"  component={SignUpScreen}  options={{ title: 'Sign Up' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : user.role === 'rescuer' ? (
        <RescuerPlaceholderScreen />
      ) : (
        <CitizenTabs />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 64,
    paddingTop: 6,
    paddingBottom: 8,
  },
  iconWrap: {
    width: 40, height: 28, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.primaryLight },
});
