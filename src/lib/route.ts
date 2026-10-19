
import type { LineString } from "geojson";

export type Coordinates = {
  longitude: number;
  latitude: number;
};

export type RouteEstimate = {
  distanceKm: number;
  durationMinutes: number;
  geometry: LineString;
};

export async function getRoute(
  pickup: Coordinates,
  destination: Coordinates
): Promise<RouteEstimate> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Mapbox access token is missing.");
  }

  const validCoordinates = (point: Coordinates) =>
    Number.isFinite(point.longitude) &&
    Number.isFinite(point.latitude) &&
    Math.abs(point.longitude) <= 180 &&
    Math.abs(point.latitude) <= 90;

  if (!validCoordinates(pickup) || !validCoordinates(destination)) {
    throw new Error("Invalid pickup or destination coordinates.");
  }

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${pickup.longitude},${pickup.latitude};` +
    `${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson&steps=false&access_token=${encodeURIComponent(token)}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.text();
    console.error("Mapbox directions error:", error);
    throw new Error("Could not calculate the route. Please try again.");
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route || !route.geometry || route.distance <= 0) {
    throw new Error("No driving route found between these locations.");
  }

  const estimate: RouteEstimate = {
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
    geometry: route.geometry as LineString,
  };

  console.log("Route estimate:", {
    pickup,
    destination,
    distanceKm: estimate.distanceKm,
    durationMinutes: estimate.durationMinutes,
  });

  return estimate;
}
