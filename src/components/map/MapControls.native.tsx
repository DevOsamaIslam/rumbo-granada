import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

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
  return (
    <TouchableOpacity
      style={[styles.controlButton, active && styles.controlButtonActive]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[
        styles.iconText,
        { color: color || (active ? '#6200EE' : '#333') }
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

const styles = StyleSheet.create({
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
    backgroundColor: 'white',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonActive: {
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default MapControls;
