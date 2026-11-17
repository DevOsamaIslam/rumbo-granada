import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Title, Button } from 'react-native-paper';
import { useAppColors, useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

export default function NotFoundScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Title style={styles.title}>404 - Not Found</Title>
      <Text style={styles.subtitle}>The screen you&apos;re looking for doesn&apos;t exist.</Text>
      <Button mode="contained" color={colors.secondary} onPress={() => router.back()}>
        Go Back
      </Button>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    marginBottom: 8,
    color: colors.onBackground,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
});