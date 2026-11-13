import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { SearchBar } from '@/components/common';

export default function LinesScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Bus Lines</Text>
          </View>
          <SearchBar
            placeholder="Search lines..."
            value={query}
            onChangeText={setQuery}
            style={styles.searchBar}
          />
        </View>
        <Text style={styles.subtitle}>List of all Granada bus lines from GTFS</Text>
        {query && <Text style={styles.filterText}>Filtering: {query}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  titleContainer: {
    flexShrink: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  searchBar: {
    flex: 1,
    minWidth: 150,
    maxWidth: 300,
  },
  subtitle: {
    color: '#79747E',
    textAlign: 'center',
    marginTop: 20,
  },
  filterText: {
    color: '#6200EE',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});