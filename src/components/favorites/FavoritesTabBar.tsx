import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

export type FavoritesTab = 'favoriteLines' | 'favoriteStops' | 'previousReminders';

export interface FavoritesTabBarProps {
  tab: FavoritesTab;
  onTabChange: (tab: FavoritesTab) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

/** Tab switcher for the favorites screen. */
export function FavoritesTabBar({
  tab,
  onTabChange,
  onRefresh,
  refreshing,
}: FavoritesTabBarProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.toolbar}>
      <View style={styles.tabs}>
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
          label={t('previousReminders', { ns: 'translation' })}
          active={tab === 'previousReminders'}
          onPress={() => onTabChange('previousReminders')}
        />
      </View>
      <View style={styles.toolbarActions}>
        <IconButton
          icon='refresh'
          onPress={onRefresh}
          accessibilityLabel={t('refresh', { ns: 'translation' })}
          disabled={refreshing}
        />
      </View>
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
  toolbarActions: {
    flexDirection: 'row',
  },
});
