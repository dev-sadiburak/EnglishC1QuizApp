import { Ionicons } from '@expo/vector-icons'; // İkonlar için
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Platform } from 'react-native';

// Ekranlarımızı import ediyoruz
import QuizScreen from './src/screens/QuizScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatsScreen from './src/screens/StatsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, // Üstteki default header'ı gizle (Kendi tasarımımız var)
          tabBarActiveTintColor: '#007AFF', // Seçili ikon rengi
          tabBarInactiveTintColor: 'gray',  // Pasif ikon rengi
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e5e5e5',
            // iOS ve Android için dinamik yükseklik ve boşluk
            height: Platform.OS === 'ios' ? 85 : 80, 
            paddingBottom: Platform.OS === 'ios' ? 25 : 12,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          // İkon mantığı
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
        <Tab.Screen name="Quiz" component={QuizScreen} options={{ title: 'Soru Çöz' }} />
        <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'İstatistik' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}