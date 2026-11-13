// Favorites Hook
import { useCallback } from 'react';
import { useFavoritesStore } from '@/store/favorites';
import { FavoriteBus, FavoriteStop } from '@/types/favorites';

export function useFavorites() {
  const {
    favoriteBuses,
    favoriteStops,
    addFavoriteBus,
    removeFavoriteBus,
    addFavoriteStop,
    removeFavoriteStop,
    updateStopLabel,
  } = useFavoritesStore();

  const toggleFavoriteBus = useCallback((bus: FavoriteBus) => {
    const isFavorite = favoriteBuses.some((b) => b.routeId === bus.routeId);
    if (isFavorite) {
      removeFavoriteBus(bus.routeId);
    } else {
      addFavoriteBus(bus);
    }
  }, [favoriteBuses, addFavoriteBus, removeFavoriteBus]);

  const toggleFavoriteStop = useCallback((stop: FavoriteStop) => {
    const isFavorite = favoriteStops.some((s) => s.stopId === stop.stopId);
    if (isFavorite) {
      removeFavoriteStop(stop.stopId);
    } else {
      addFavoriteStop(stop);
    }
  }, [favoriteStops, addFavoriteStop, removeFavoriteStop]);

  const isBusFavorite = useCallback(
    (routeId: string) => favoriteBuses.some((b) => b.routeId === routeId),
    [favoriteBuses]
  );

  const isStopFavorite = useCallback(
    (stopId: string) => favoriteStops.some((s) => s.stopId === stopId),
    [favoriteStops]
  );

  const getStopLabel = useCallback(
    (stopId: string) => favoriteStops.find((s) => s.stopId === stopId)?.label,
    [favoriteStops]
  );

  return {
    favoriteBuses,
    favoriteStops,
    toggleFavoriteBus,
    toggleFavoriteStop,
    updateStopLabel,
    isBusFavorite,
    isStopFavorite,
    getStopLabel,
  };
}