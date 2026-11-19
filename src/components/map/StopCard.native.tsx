import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { IconButton } from "react-native-paper";
import { useAppColors, useThemedStyles } from "@/constants/themes";
import type { AppColors } from "@/constants/colors";
import { useTranslation } from "react-i18next";
import type { Stop } from "@/types/gtfs";

interface StopCardProps {
  stop: Stop;
  /**
   * Clears the focused stop and resets the map filter. Exposed as the card's
   * cancel icon: while a stop is focused the map only shows that stop, so the
   * card is the only way back to the unfiltered map.
   */
  onClose: () => void;
}

/**
 * Overlay shown on the map while a single stop is focused. The lines serving
 * the stop are already drawn on the map itself (the stop marker renders one
 * coloured circle per line at the focus zoom), so the card only carries the
 * stop's identity and the cancel action.
 */
export function StopCard({ stop, onClose }: StopCardProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.name}>{stop.stop_name}</Text>
            {stop.stop_code && (
              <Text style={styles.code}>{t('stopCode', { ns: 'translation', code: stop.stop_code })}</Text>
            )}
          </View>
          <IconButton
            icon="close"
            size={22}
            iconColor={colors.onSurfaceVariant}
            onPress={onClose}
            accessibilityLabel={t('closeStopCard', { ns: 'translation' })}
            testID="stop-card-close"
            style={styles.closeButton}
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 320,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.onSurface,
  },
  code: {
    fontSize: 12,
    color: colors.outline,
  },
  closeButton: {
    marginTop: -8,
    marginEnd: -8,
  },
});

export default StopCard;