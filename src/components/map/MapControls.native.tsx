import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

interface MapControlsProps {
  onToggleFollow: () => void;
  followMode: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

function ControlButton({
  icon,
  onPress,
  accessibilityLabel,
  active = false,
  color,
}: {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
  color?: string;
}) {
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity
      style={[styles.controlButton, active && styles.controlButtonActive]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[
        styles.iconText,
        { color: color || (active ? colors.primary : colors.onSurface) }
      ]}>
        {icon}
      </Text>
    </TouchableOpacity>
  );
}

export function MapControls({
  onToggleFollow,
  followMode,
  onZoomIn,
  onZoomOut,
}: MapControlsProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.controlsContainer} pointerEvents="box-none">
      <View style={styles.controlGroup}>
        <ControlButton
          icon="📍"
          onPress={onToggleFollow}
          accessibilityLabel={followMode ? 'Desactivar seguimiento' : 'Activar seguimiento'}
          active={followMode}
        />
        <ControlButton
          icon="+"
          onPress={onZoomIn ?? (() => {})}
          accessibilityLabel="Acercar"
        />
        <ControlButton
          icon="-"
          onPress={onZoomOut ?? (() => {})}
          accessibilityLabel="Alejar"
        />
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    zIndex: 100,
  },
  controlGroup: {
    flexDirection: 'column',
    gap: 8,
  },
  controlButton: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default MapControls;
