import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Title } from 'react-native-paper';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Title style={styles.title}>Settings Screen</Title>
      <Text style={styles.subtitle}>App settings and notification preferences</Text>
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
  },
});