import React, { useMemo } from "react";
import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
import { Route } from "@/types/gtfs";
import { gtfsService } from "@/services/gtfs";

interface RoutePolylineProps {
  lineId: string;
  routes: Route[];
  /** Current map zoom level, used to fade the line in above MAP_LINE_ZOOM. */
  zoomLevel?: number;
}

export function RoutePolyline({ lineId, routes, zoomLevel = 14 }: RoutePolylineProps) {
  const route = routes.find((r) => r.route_id === lineId);
  const geojson = useMemo(() => {
    if (!route?.shape_id) return null;
    const shapes = gtfsService.getShapeForRoute(lineId);
    if (shapes.length === 0) return null;
    const coordinates = shapes.map((shape) => [
      shape.shape_pt_lon,
      shape.shape_pt_lat,
    ]);
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      ],
    } as GeoJSON.FeatureCollection;
  }, [route, lineId]);

  if (!geojson) return null;

  const routeColor = route?.route_color || "#6200EE";
  // Fade the line in once the user is zoomed in sufficiently, so the map
  // isn't cluttered with route shapes at low zoom levels.
  const lineOpacity = zoomLevel >= 15 ? 0.8 : 0;
  // Source and layer ids must be unique per line so several route polylines
  // can be drawn at once (e.g. every line serving a stop when zoomed in).
  const sourceId = `route-line-${lineId}`;
  const layerId = `route-line-layer-${lineId}`;

  return (
    <GeoJSONSource id={sourceId} data={geojson}>
      <Layer
        id={layerId}
        type="line"
        source={sourceId}
        paint={{
          "line-color": routeColor,
          "line-width": 3,
          "line-opacity": lineOpacity,
        }}
        layout={{ "line-join": "round", "line-cap": "round" }}
      />
    </GeoJSONSource>
  );
}

export default RoutePolyline;