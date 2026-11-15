import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#D0BCFF' : '#6200EE',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#79747E' : '#79747E',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#333333' : '#E0E0E0',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius" color={(color as string) ?? (colorScheme === 'dark' ? '#D0BCFF' : '#6200EE')} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lines"
        options={{
          title: 'Lines',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus" color={(color as string) ?? (colorScheme === 'dark' ? '#D0BCFF' : '#6200EE')} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" color={(color as string) ?? (colorScheme === 'dark' ? '#D0BCFF' : '#6200EE')} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={(color as string) ?? (colorScheme === 'dark' ? '#D0BCFF' : '#6200EE')} size={size} />
          ),
        }}
      />
      {/* Detail screens render inside the tab navigator (with the tab bar
          visible) but without a tab button. NOTE: do not use `href: null`
          here — in SDK 58's tabs, a focused hidden screen is redirected to
          the initial tab. `tabBarButton: () => null` only hides the button. */}
      <Tabs.Screen
        name="line/[id]"
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="stop/[id]"
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}