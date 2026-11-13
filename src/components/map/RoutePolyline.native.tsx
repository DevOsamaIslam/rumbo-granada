import React from 'react';
import { Polyline } from 'react-native-maps';
import { Route } from '@/types/gtfs';
import { gtfsService } from '@/services/gtfs';

interface RoutePolylineProps {
  lineId: string;
  routes: Route[];
}

export function RoutePolyline({ lineId, routes }: RoutePolylineProps) {
  const route = routes.find((r) => r.route_id === lineId);
  if (!route?.shape_id) return null;

  // Get shape points from GTFS service
  const shapes = gtfsService.getShapeForRoute(lineId);
  if (shapes.length === 0) return null;

  // Convert shape points to coordinates
  const coordinates = shapes.map((shape) => ({
    latitude: shape.shape_pt_lat,
    longitude: shape.shape_pt_lon,
  }));

  if (coordinates.length === 0) return null;

  // Get route color if available
  const strokeColor = route.route_color ? `#${route.route_color}` : '#1976D2';

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={strokeColor}
      strokeWidth={4}
      geodesic={true}
      zIndex={5}
    />
  );
}

export default RoutePolyline;