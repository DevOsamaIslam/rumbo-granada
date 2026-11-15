import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text as PaperText, Title } from 'react-native-paper';
import { useSettingsStore } from '@/store/settings';
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
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

const MAP_STYLE_OPTIONS: { value: MapStyle; label: string }[] = [
  { value: 'standard', label: 'Estándar' },
  { value: 'dark', label: 'Oscuro' },
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
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Text style={styles.rowLabel}>{title}</Text>
      <Text style={styles.toggleValue}>{value ? 'Activado' : 'Desactivado'}</Text>
    </Pressable>
  );
}

/**
 * Settings screen.
 *
 * - Idioma: persists the UI language choice (`es`/`en`) in the settings store.
 *   This is a UI-only setting: the app's strings are shipped in Spanish.
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

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Title style={styles.title}>Ajustes</Title>
        <PaperText style={styles.subtitle}>Idioma, mapa y preferencias</PaperText>

        <SectionTitle text="Idioma" />
        <PaperText style={styles.description}>Idioma de la interfaz.</PaperText>
        {LANGUAGE_OPTIONS.map((option) => (
          <RadioRow
            key={option.value}
            label={option.label}
            selected={language === option.value}
            onPress={() => setLanguage(option.value)}
          />
        ))}

        <SectionTitle text="Estilo del mapa" />
        <PaperText style={styles.description}>Aspecto del mapa en la pantalla principal.</PaperText>
        {MAP_STYLE_OPTIONS.map((option) => (
          <RadioRow
            key={option.value}
            label={option.label}
            selected={mapStyle === option.value}
            onPress={() => setMapStyle(option.value)}
          />
        ))}

        <SectionTitle text="Preferencias" />
        <ToggleRow
          title="Seguir mi posición automáticamente"
          value={autoFollowUser}
          onPress={() => setAutoFollowUser(!autoFollowUser)}
        />
        <ToggleRow
          title="Mostrar etiquetas de autobuses"
          value={showBusLabels}
          onPress={() => setShowBusLabels(!showBusLabels)}
        />

        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Umbral de notificaciones (minutos)</Text>
          <Pressable
            style={styles.stepButton}
            onPress={() =>
              setNotificationThreshold(Math.max(notificationThresholdMinutes - 1, THRESHOLD_MIN))
            }
            accessibilityLabel="Disminuir umbral"
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.thresholdValue}>{notificationThresholdMinutes}</Text>
          <Pressable
            style={styles.stepButton}
            onPress={() =>
              setNotificationThreshold(Math.min(notificationThresholdMinutes + 1, THRESHOLD_MAX))
            }
            accessibilityLabel="Aumentar umbral"
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

