import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { colors } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Party',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="roll"
        options={{
          title: 'Roll',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="dice-multiple" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reference"
        options={{
          title: 'Rules',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="book-open-variant" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
