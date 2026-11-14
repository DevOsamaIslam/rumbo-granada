import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Title, Divider } from 'react-native-paper';
import { useFavorites } from '@/hooks/useFavorites';

import { COLORS } from '@/constants/colors';
import { IconButton } from 'react-native-paper';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { favoriteBuses, isBusFavorite, toggleFavoriteBus } = useFavorites();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Title style={styles.title}>Favorite Bus Lines</Title>
        {favoriteBuses.length === 0 ? (
          <Text style={styles.emptyMessage}>No favorite bus lines yet</Text>
        ) : (
          <FlatList
            data={favoriteBuses}
            keyExtractor={(bus) => bus.routeId}
            renderItem={({ item }) => (
              <Pressable style={styles.busItem} onPress={() => toggleFavoriteBus({
                routeId: item.routeId,
                routeShortName: item.routeShortName,
                routeLongName: item.routeLongName,
                routeColor: item.routeColor,
                routeTextColor: item.routeTextColor,
              })}> 
                <View style={styles.badgeBackground}>
                  <Text style={styles.badgeText}>{item.routeShortName}</Text>
                </View>
                <View style={styles.busInfo}>
                  <Text style={styles.busName}>{item.routeLongName}</Text>
                  <Text style={styles.busRoutes}>Line {item.routeShortName}</Text>
                </View>
                <IconButton
                  icon={isBusFavorite(item.routeId) ? 'star' : 'star-outline'}
                  onPress={() => toggleFavoriteBus({
                    routeId: item.routeId,
                    routeShortName: item.routeShortName,
                    routeLongName: item.routeLongName,
                    routeColor: item.routeColor,
                    routeTextColor: item.routeTextColor,
                  })}
                  accessibilityLabel={isBusFavorite(item.routeId) ? 'Remove from favorites' : 'Add to favorites'}
                />
              </Pressable>
            )}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
        <Divider style={styles.divider} />
        <Text style={styles.subtitle}>Favorite bus lines and labeled stops</Text>
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
  title: {
    marginBottom: 8,
  },
  emptyMessage: {
    color: '#79747E',
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  divider: {
    marginVertical: 8,
    borderColor: '#EEE',
  },
  subtitle: {
    color: '#79747E',
    textAlign: 'center',
    marginTop: 4,
  },
  busItem: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  busInfo: {
    flex: 1,
  },
  busName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  busRoutes: {
    fontSize: 12,
    color: COLORS.outline,
    marginTop: 2,
  },
  listContent: {
    paddingVertical: 8,
  },
});