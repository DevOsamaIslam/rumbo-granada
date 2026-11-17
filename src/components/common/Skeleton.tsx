import { StyleSheet, View, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

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
  const styles = useThemedStyles(createStyles);
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
  const styles = useThemedStyles(createStyles);
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

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  badgeSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVariant,
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  lineSkeleton: {
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
  lineSkeletonShort: {
    height: 16,
    width: '60%',
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
});