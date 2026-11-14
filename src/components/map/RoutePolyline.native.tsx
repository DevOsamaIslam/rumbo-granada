import React, { useMemo } from "react";
import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
import { Route } from "@/types/gtfs";
import { gtfsService } from "@/services/gtfs";

interface RoutePolylineProps {
  lineId: string;
  routes: Route[];
}

export function RoutePolyline({ lineId, routes }: RoutePolylineProps) {
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

  return (
    <GeoJSONSource id="route-line" data={geojson}>
      <Layer
        id="route-line-layer"
        type="line"
        source="route-line"
        paint={{
          "line-color": routeColor,
          "line-width": 3,
          "line-opacity": 0.8,
        }}
        layout={{ "line-join": "round", "line-cap": "round" }}
      />
    </GeoJSONSource>
  );
}

export default RoutePolyline;