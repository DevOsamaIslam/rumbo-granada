import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

import type { Region } from './types';

interface MapWebFallbackProps {
  initialRegion?: Region;
}

export const MapWebFallback = ({ initialRegion }: MapWebFallbackProps) => {
  void initialRegion;
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.map}>
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          Map view is available on iOS and Android apps.
          <Text style={{ marginTop: 8 }}>Web version coming soon.</Text>
        </Text>
      </View>
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  map: { flex: 1 },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: 20,
  },
  fallbackText: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
});
