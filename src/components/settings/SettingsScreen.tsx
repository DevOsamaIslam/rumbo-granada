import { useState, type ComponentProps, type ReactNode } from 'react';
import { Alert, DevSettings, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import i18n, { type AppLanguage } from '@/i18n';
import { useSettingsStore } from '@/store/settings';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';
import { applyLayoutDirection } from '@/utils/rtl';
import { hapticTap } from '@/utils/haptics';

type Language = AppLanguage;
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Brand mark shown in the footer, matching the app header. */
const LOGO = require('../../../assets/logo.png');

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'es', label: 'spanish' },
  { value: 'en', label: 'english' },
  { value: 'ar', label: 'arabic' },
];

/** Notification threshold bounds, in minutes. */
const THRESHOLD_MIN = 1;
const THRESHOLD_MAX = 180;

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Grouped settings card with an uppercase section label and a hint line. */
function Section({ title, description, children }: SectionProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function IconBadge({ name }: { name: IconName }) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppColors();
  return (
    <View style={styles.iconBadge}>
      <MaterialCommunityIcons name={name} size={18} color={colors.primary} />
    </View>
  );
}

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
}

/**
 * Language picker. The row shows the current language and opens a modal list so
 * the settings card stays compact; choosing a language applies it immediately.
 */
function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const current =
    LANGUAGE_OPTIONS.find((option) => option.value === value) ?? LANGUAGE_OPTIONS[0];

  return (
    <View>
      <Pressable
        style={[styles.row, styles.lastRow]}
        onPress={() => {
          void hapticTap();
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${t('language')}: ${t(current.label)}`}
      >
        <IconBadge name="translate" />
        <Text style={styles.rowLabel}>{t(current.label)}</Text>
        <MaterialCommunityIcons name="chevron-down" size={22} color={colors.outline} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              {t('selectLanguage')}
            </Text>
            {LANGUAGE_OPTIONS.map((option, index) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.sheetRow,
                    index === LANGUAGE_OPTIONS.length - 1 && styles.lastRow,
                  ]}
                  onPress={() => {
                    setOpen(false);
                    onChange(option.value);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t(option.label)}
                >
                  <Text style={styles.rowLabel}>{t(option.label)}</Text>
                  <MaterialCommunityIcons
                    name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                    size={22}
                    color={selected ? colors.primary : colors.outline}
                  />
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

interface ToggleRowProps {
  icon: IconName;
  title: string;
  value: boolean;
  last?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/**
 * Switch row. The whole row is the touch target (with the switch label and
 * role), while the visible switch is decorative so screen readers announce one
 * control instead of two.
 */
function ToggleRow({ icon, title, value, last, disabled = false, onPress }: ToggleRowProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppColors();
  return (
    <Pressable
      style={[styles.row, last && styles.lastRow, disabled && styles.disabledRow]}
      onPress={() => {
        if (disabled) return;
        void hapticTap();
        onPress();
      }}
      accessibilityLabel={title}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
    >
      <IconBadge name={icon} />
      <Text style={styles.rowLabel}>{title}</Text>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Switch
          value={value}
          disabled={disabled}
          color={colors.primary}
          trackColor={{ false: colors.outlineVariant, true: colors.primary }}
        />
      </View>
    </Pressable>
  );
}

interface StepperRowProps {
  icon: IconName;
  title: string;
  hint: string;
  value: number;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
}

/** Numeric row with −/+ steppers (notification lead time). */
function StepperRow({
  icon,
  title,
  hint,
  value,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
}: StepperRowProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppColors();
  return (
    <View style={[styles.row, styles.lastRow]}>
      <IconBadge name={icon} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{title}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepButton}
          onPress={() => {
            void hapticTap();
            onDecrease();
          }}
          accessibilityRole="button"
          accessibilityLabel={decreaseLabel}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="minus" size={18} color={colors.primary} />
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable
          style={styles.stepButton}
          onPress={() => {
            void hapticTap();
            onIncrease();
          }}
          accessibilityRole="button"
          accessibilityLabel={increaseLabel}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Settings screen.
 *
 * - Idioma: persists the UI language choice (`es`/`en`) in the settings store
 *   and switches the i18n language. All strings come from the locale files.
 * - Estilo del mapa: persists `standard`/`dark` and is consumed by `MapView`.
 * - Preferencias: notification threshold, auto-follow position and bus labels.
 *   All values are persisted to MMKV via the zustand settings store.
 */
export function SettingsScreen() {
  const {
    language,
    setLanguage,
    mapStyle,
    setMapStyle,
    notificationThresholdMinutes,
    setNotificationThreshold,
    autoFollowUser,
    setAutoFollowUser,
    showBusLabels,
    setShowBusLabels,
    theme,
    setTheme,
  } = useSettingsStore();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const version = Constants.expoConfig?.version;

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    i18n.changeLanguage(value);
    // RTL is a native layout direction: when it flips, ask for a restart.
    const { changed } = applyLayoutDirection(value);
    if (changed) {
      Alert.alert(t('restartRequiredTitle'), t('restartRequiredMessage'), [
        { text: t('ok'), style: 'cancel' },
        { text: t('restart'), onPress: () => DevSettings?.reload?.() },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t('appName')}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {t('settings')}
          </Text>
          <Text style={styles.subtitle}>{t('settingsSubtitle')}</Text>
        </View>

        <Section title={t('language')} description={t('selectLanguageDescription')}>
          <LanguageSelector value={language} onChange={handleLanguageChange} />
        </Section>

        <Section title={t('mapStyle')} description={t('mapStyleDescription')}>
          <ToggleRow
            icon="map-outline"
            title={t('darkMap')}
            value={mapStyle === 'dark'}
            last
            onPress={() => setMapStyle(mapStyle === 'dark' ? 'standard' : 'dark')}
          />
        </Section>

        <Section title={t('theme')} description={t('themeDescription')}>
          <ToggleRow
            icon="theme-light-dark"
            title={t('followSystemTheme')}
            value={theme === 'system'}
            onPress={() => setTheme(theme === 'system' ? 'light' : 'system')}
          />
          <ToggleRow
            icon="weather-night"
            title={t('darkMode')}
            value={theme === 'dark'}
            last
            disabled={theme === 'system'}
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        </Section>

        <Section title={t('preferences')}>
          <ToggleRow
            icon="crosshairs-gps"
            title={t('autoFollow')}
            value={autoFollowUser}
            onPress={() => setAutoFollowUser(!autoFollowUser)}
          />
          <ToggleRow
            icon="tag-outline"
            title={t('showBusLabels')}
            value={showBusLabels}
            onPress={() => setShowBusLabels(!showBusLabels)}
          />
          <StepperRow
            icon="bell-outline"
            title={t('notificationThreshold')}
            hint={t('notificationThresholdHint')}
            value={notificationThresholdMinutes}
            decreaseLabel={t('decreaseThreshold')}
            increaseLabel={t('increaseThreshold')}
            onDecrease={() =>
              setNotificationThreshold(
                Math.max(notificationThresholdMinutes - 1, THRESHOLD_MIN),
              )
            }
            onIncrease={() =>
              setNotificationThreshold(
                Math.min(notificationThresholdMinutes + 1, THRESHOLD_MAX),
              )
            }
          />
        </Section>

        <View style={styles.footer}>
          <Image source={LOGO} style={styles.footerLogo} />
          <Text style={styles.footerName}>{t('appName')}</Text>
          <Text style={styles.footerTagline}>{t('appTagline')}</Text>
          {version ? <Text style={styles.footerVersion}>v{version}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 24,
  },
  hero: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.outline,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: -2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  disabledRow: {
    opacity: 0.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    padding: 16,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.onSurface,
  },
  rowHint: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}14`,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  footerLogo: {
    width: 40,
    height: 38,
    resizeMode: 'contain',
    opacity: 0.9,
  },
  footerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  footerTagline: {
    fontSize: 12,
    color: colors.outline,
  },
  footerVersion: {
    fontSize: 11,
    color: colors.outline,
  },
  });

