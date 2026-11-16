import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Title, Button } from 'react-native-paper';
import { COLORS } from '@/constants/colors';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Title style={styles.title}>404 - Not Found</Title>
      <Text style={styles.subtitle}>The screen you&apos;re looking for doesn&apos;t exist.</Text>
      <Button mode="contained" color={COLORS.secondary} onPress={() => router.back()}>
        Go Back
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    color: '#79747E',
    textAlign: 'center',
    marginBottom: 24,
  },
});