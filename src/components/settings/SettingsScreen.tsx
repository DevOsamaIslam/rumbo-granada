import type { ComponentProps, ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useSettingsStore } from '@/store/settings';
import { COLORS } from '@/constants/colors';
import { hapticTap } from '@/utils/haptics';

type Language = 'es' | 'en';
type MapStyle = 'standard' | 'dark';
type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Brand mark shown in the footer, matching the app header. */
const LOGO = require('../../../assets/logo.png');

/** Cards sit on the warm app background, so they use the plain surface white. */
const CARD_BACKGROUND = '#FFFFFF';
/** Soft brand-red wash behind each row icon. */
const ICON_BADGE_BACKGROUND = 'rgba(160, 0, 32, 0.08)';

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'es', label: 'spanish' },
  { value: 'en', label: 'english' },
];

const MAP_STYLE_OPTIONS: { value: MapStyle; label: string }[] = [
  { value: 'standard', label: 'mapStyleStandard' },
  { value: 'dark', label: 'mapStyleDark' },
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
  return (
    <View style={styles.iconBadge}>
      <MaterialCommunityIcons name={name} size={18} color={COLORS.primary} />
    </View>
  );
}

interface OptionRowProps {
  icon: IconName;
  label: string;
  selected: boolean;
  last?: boolean;
  onPress: () => void;
}

/** Single-choice row: the radio mark mirrors the accessibility state. */
function OptionRow({ icon, label, selected, last, onPress }: OptionRowProps) {
  return (
    <Pressable
      style={[styles.row, last && styles.lastRow]}
      onPress={() => {
        void hapticTap();
        onPress();
      }}
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <IconBadge name={icon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <MaterialCommunityIcons
        name={selected ? 'radiobox-marked' : 'radiobox-blank'}
        size={22}
        color={selected ? COLORS.primary : COLORS.outline}
      />
    </Pressable>
  );
}

interface ToggleRowProps {
  icon: IconName;
  title: string;
  value: boolean;
  last?: boolean;
  onPress: () => void;
}

/**
 * Switch row. The whole row is the touch target (with the switch label and
 * role), while the visible switch is decorative so screen readers announce one
 * control instead of two.
 */
function ToggleRow({ icon, title, value, last, onPress }: ToggleRowProps) {
  return (
    <Pressable
      style={[styles.row, last && styles.lastRow]}
      onPress={() => {
        void hapticTap();
        onPress();
      }}
      accessibilityLabel={title}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
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
          color={COLORS.primary}
          trackColor={{ false: COLORS.outlineVariant, true: COLORS.primary }}
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
          <MaterialCommunityIcons name="minus" size={18} color={COLORS.primary} />
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
          <MaterialCommunityIcons name="plus" size={18} color={COLORS.primary} />
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
  } = useSettingsStore();
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version;

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
          {LANGUAGE_OPTIONS.map((option, index) => (
            <OptionRow
              key={option.value}
              icon="translate"
              label={t(option.label)}
              selected={language === option.value}
              last={index === LANGUAGE_OPTIONS.length - 1}
              onPress={() => {
                setLanguage(option.value);
                i18n.changeLanguage(option.value);
              }}
            />
          ))}
        </Section>

        <Section title={t('mapStyle')} description={t('mapStyleDescription')}>
          {MAP_STYLE_OPTIONS.map((option, index) => (
            <OptionRow
              key={option.value}
              icon={option.value === 'dark' ? 'theme-light-dark' : 'map-outline'}
              label={t(option.label)}
              selected={mapStyle === option.value}
              last={index === MAP_STYLE_OPTIONS.length - 1}
              onPress={() => setMapStyle(option.value)}
            />
          ))}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.primary,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.outline,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: -2,
  },
  card: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outlineVariant,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.onSurface,
  },
  rowHint: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ICON_BADGE_BACKGROUND,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
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
    color: COLORS.primary,
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
    color: COLORS.onSurfaceVariant,
  },
  footerTagline: {
    fontSize: 12,
    color: COLORS.outline,
  },
  footerVersion: {
    fontSize: 11,
    color: COLORS.outline,
  },
});

