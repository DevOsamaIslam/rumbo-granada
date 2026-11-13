// Favorites Types
import { Route, Stop } from './gtfs';

export interface FavoriteBus {
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor: string;
  routeTextColor: string;
}

export interface FavoriteStop {
  stopId: string;
  stopName: string;
  label: string;
  lat: number;
  lon: number;
}

export interface FavoriteBusWithRoute extends FavoriteBus {
  route: Route;
}

export interface FavoriteStopWithStop extends FavoriteStop {
  stop: Stop;
}