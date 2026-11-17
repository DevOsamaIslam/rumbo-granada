import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.outline,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.outlineVariant,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lines"
        options={{
          title: 'Lines',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stops"
        options={{
          title: 'Stops',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color as string} size={size} />
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