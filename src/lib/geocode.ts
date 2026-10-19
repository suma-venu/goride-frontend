
export type PlaceSuggestion = {
  id: string;
  name: string;
  fullAddress: string;
  longitude: number;
  latitude: number;
};

export type Coordinates = {
  longitude: number;
  latitude: number;
};

export async function searchPlaces(
  query: string
): Promise<PlaceSuggestion[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) throw new Error("Mapbox access token is missing.");
  if (query.trim().length < 3) return [];

  const params = new URLSearchParams({
    access_token: token,
    country: "IN",
    language: "en",
    limit: "5",
    autocomplete: "true",
    types: "poi,address,neighborhood,locality,place",
  });

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json?${params}`
  );

  if (!response.ok) {
    throw new Error("Unable to search locations.");
  }

  const data = await response.json();

  return (data.features ?? []).map((feature: any) => ({
    id: feature.id,
    name: feature.text,
    fullAddress: feature.place_name,
    longitude: feature.center[0],
    latitude: feature.center[1],
  }));
}

export async function geocodePlace(
  query: string
): Promise<Coordinates> {
  const results = await searchPlaces(query);

  if (!results.length) {
    throw new Error(`No location found for "${query}".`);
  }

  return {
    longitude: results[0].longitude,
    latitude: results[0].latitude,
  };
}
