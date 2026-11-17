import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

export type FavoritesTab =
  | 'favoriteLines'
  | 'favoriteStops'
  | 'recentTrackings';

export interface FavoritesTabBarProps {
  tab: FavoritesTab;
  onTabChange: (tab: FavoritesTab) => void;
}

/** Tab switcher for the favorites screen. */
export function FavoritesTabBar({
  tab,
  onTabChange,
}: FavoritesTabBarProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.toolbar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
      >
        <TabButton
          label={t('lines', { ns: 'translation' })}
          active={tab === 'favoriteLines'}
          onPress={() => onTabChange('favoriteLines')}
        />
        <TabButton
          label={t('stops', { ns: 'translation' })}
          active={tab === 'favoriteStops'}
          onPress={() => onTabChange('favoriteStops')}
        />
        <TabButton
          label={t('recentTrackings', { ns: 'translation' })}
          active={tab === 'recentTrackings'}
          onPress={() => onTabChange('recentTrackings')}
        />
      </ScrollView>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      accessibilityRole='tab'
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabsScroll: {
    flexShrink: 1,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primaryContainer,
  },
  tabText: {
    fontSize: 14,
    color: colors.outline,
  },
  tabTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: '600',
  },
});
