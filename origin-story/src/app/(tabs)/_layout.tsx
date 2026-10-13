import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { fonts, useColors } from '../../theme';

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.blue },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 26, letterSpacing: 1 },
        headerShadowVisible: false,
        tabBarActiveTintColor: c.dark ? c.yellow : c.blue,
        tabBarInactiveTintColor: c.faint,
        tabBarStyle: { backgroundColor: c.panel, borderTopColor: c.line, borderTopWidth: 2 },
        tabBarLabelStyle: { fontWeight: '800' },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Heroes',
          headerTitle: 'Origin Story',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="card-account-details-star" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scene"
        options={{
          title: 'Scene',
          headerTitle: 'GM Scene Tracker',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="flag-checkered" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="dice"
        options={{
          title: 'Dice',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="dice-multiple" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rules"
        options={{
          title: 'Rules',
          headerTitle: 'Quick Reference',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="book-open-page-variant" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
