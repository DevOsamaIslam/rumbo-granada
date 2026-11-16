import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/colors';

/**
 * A loading skeleton shimmer displayed in place of content while data loads.
 *
 * `width` and `height` default to filling the available space; pass explicit
 * values to size the skeleton to match the real content it replaces.
 */
export function Skeleton({
  width,
  height,
  style,
}: {
  width?: number;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height },
        style,
      ]}
    />
  );
}

/**
 * A row of skeletons matching the shape of a list item (badge + two lines).
 */
export function SkeletonListItem() {
  return (
    <View style={styles.rowContainer}>
      <View style={styles.badgeSkeleton} />
      <View style={styles.textContainer}>
        <View style={styles.lineSkeleton} />
        <View style={styles.lineSkeletonShort} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  badgeSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceVariant,
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  lineSkeleton: {
    height: 16,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceVariant,
  },
  lineSkeletonShort: {
    height: 16,
    width: '60%',
    borderRadius: 4,
    backgroundColor: COLORS.surfaceVariant,
  },
});