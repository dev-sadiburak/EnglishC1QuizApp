import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useContext } from 'react';
import { Platform } from 'react-native';
import { LanguageProvider, LanguageContext } from './src/context/LanguageContext';

import QuizScreen from './src/screens/QuizScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatsScreen from './src/screens/StatsScreen';

const Tab = createBottomTabNavigator();

function App() {
  return (
    <LanguageProvider>
      <AppNavigator />
    </LanguageProvider>
  );
}

function AppNavigator() {
  const { t } = useContext(LanguageContext)!;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e5e5e5',
            height: Platform.OS === 'ios' ? 85 : 80,
            paddingBottom: Platform.OS === 'ios' ? 25 : 12,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Quiz') {
              iconName = focused ? 'game-controller' : 'game-controller-outline';
            } else if (route.name === 'Stats') {
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else {
              iconName = 'alert';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Quiz" component={QuizScreen} options={{ title: t('quiz') }} />
        <Tab.Screen name="Stats" component={StatsScreen} options={{ title: t('stats') }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default App;