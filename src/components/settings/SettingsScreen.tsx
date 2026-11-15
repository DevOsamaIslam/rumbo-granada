import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as PaperText, Title } from 'react-native-paper';
import { useSettingsStore } from '@/store/settings';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { COLORS } from '@/constants/colors';

type Language = 'es' | 'en';
type MapStyle = 'standard' | 'dark';

interface RadioRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

interface ToggleRowProps {
  title: string;
  value: boolean;
  onPress: () => void;
}

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

function SectionTitle({ text }: { text: string }) {
  return <PaperText style={styles.sectionTitle}>{text}</PaperText>;
}

function RadioRow({ label, selected, onPress }: RadioRowProps) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text style={styles.radioIndicator}>{selected ? '●' : '○'}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({ title, value, onPress }: ToggleRowProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Text style={styles.rowLabel}>{title}</Text>
      <Text style={styles.toggleValue}>{value ? t('enabled') : t('disabled')}</Text>
    </Pressable>
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
  const insets = useSafeAreaInsets();
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

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Title style={styles.title}>{t('settings')}</Title>
        <PaperText style={styles.subtitle}>{t('selectLanguage', { ns: 'translation' })}</PaperText>

        <SectionTitle text={t('language', { ns: 'translation' })} />
        <PaperText style={styles.description}>{t('selectLanguageDescription', { ns: 'translation' })}</PaperText>
        {LANGUAGE_OPTIONS.map((option) => (
          <RadioRow
            key={option.value}
            label={t(option.label, { ns: 'translation' })}
            selected={language === option.value}
            onPress={() => {
              setLanguage(option.value);
              i18n.changeLanguage(option.value);
            }}
          />
        ))}

        <SectionTitle text={t('mapStyle', { ns: 'translation' })} />
        <PaperText style={styles.description}>{t('mapStyleDescription', { ns: 'translation' })}</PaperText>
        {MAP_STYLE_OPTIONS.map((option) => (
          <RadioRow
            key={option.value}
            label={t(option.label, { ns: 'translation' })}
            selected={mapStyle === option.value}
            onPress={() => setMapStyle(option.value)}
          />
        ))}

        <SectionTitle text={t('preferences', { ns: 'translation' })} />
        <ToggleRow
          title={t('autoFollow', { ns: 'translation' })}
          value={autoFollowUser}
          onPress={() => setAutoFollowUser(!autoFollowUser)}
        />
        <ToggleRow
          title={t('showBusLabels', { ns: 'translation' })}
          value={showBusLabels}
          onPress={() => setShowBusLabels(!showBusLabels)}
        />

        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>{t('notificationThreshold', { ns: 'translation' })}</Text>
          <Pressable
            style={styles.stepButton}
            onPress={() =>
              setNotificationThreshold(Math.max(notificationThresholdMinutes - 1, THRESHOLD_MIN))
            }
            accessibilityLabel={t('decreaseThreshold')}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.thresholdValue}>{notificationThresholdMinutes}</Text>
          <Pressable
            style={styles.stepButton}
            onPress={() =>
              setNotificationThreshold(Math.min(notificationThresholdMinutes + 1, THRESHOLD_MAX))
            }
            accessibilityLabel={t('increaseThreshold')}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.outline,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginTop: 20,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  radioIndicator: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  toggleValue: {
    fontSize: 14,
    color: COLORS.outline,
    fontWeight: '600',
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  thresholdLabel: {
    fontSize: 16,
    color: COLORS.onSurface,
  },
  thresholdValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  stepButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepText: {
    fontSize: 22,
    color: COLORS.primary,
  },
});

