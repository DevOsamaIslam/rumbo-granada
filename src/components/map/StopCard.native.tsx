import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { IconButton } from "react-native-paper";
import { COLORS } from "@/constants/colors";
import { useTranslation } from "react-i18next";
import { getBadgeBackgroundColor, getBadgeTextColor } from "@/utils/colors";
import type { Route, Stop } from "@/types/gtfs";

interface StopCardProps {
  stop: Stop;
  routes: Route[];
  onClose: () => void;
  onPressRoute: (route: Route) => void;
}

export function StopCard({
  stop,
  routes,
  onClose,
  onPressRoute,
}: StopCardProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel={t('closeStopCard', { ns: 'translation' })}>
        <IconButton icon="close" size={24} />
      </TouchableOpacity>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.name}>{stop.stop_name}</Text>
          {stop.stop_code && (
            <Text style={styles.code}>{t('stopCode', { ns: 'translation', code: stop.stop_code })}</Text>
          )}
        </View>
        <Text style={styles.sectionTitle}>{t('linesCount', { ns: 'translation', total: routes.length })}</Text>
        <View style={styles.routeRow}>
          {routes.length === 0 ? (
            <Text style={styles.noRoutes}>{t('noLinesRegistered', { ns: 'translation' })}</Text>
          ) : (
            routes.map((route) => {
              const color = getBadgeBackgroundColor(route.route_color, COLORS.primary);
              const textColor = getBadgeTextColor(color, route.route_text_color);
              return (
                <TouchableOpacity
                  key={route.route_id}
                  style={[styles.routeBadge, { backgroundColor: color }]}
                  onPress={() => onPressRoute(route)}
                  accessibilityLabel={t('openLine', { ns: 'translation', line: route.route_short_name })}
                >
                  <Text style={[styles.routeBadgeText, { color: textColor }]}>
                    {route.route_short_name}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 12,
    zIndex: 100,
  },
  closeIcon: {
    color: COLORS.onSurface,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 320,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.onSurface,
  },
  code: {
    fontSize: 12,
    color: COLORS.outline,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  routeBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 44,
    alignSelf: "flex-start",
  },
  routeBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  noRoutes: {
    fontSize: 13,
    color: COLORS.outline,
  },
});

export default StopCard;