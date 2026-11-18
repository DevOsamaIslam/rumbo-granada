import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '@/constants/themes';

export default function TabLayout() {
  const colors = useAppColors();
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.outlineVariant,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('map'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lines"
        options={{
          title: t('lines'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stops"
        options={{
          title: t('stops'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus-stop" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('favorites'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
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