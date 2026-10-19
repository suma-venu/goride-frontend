
"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Coordinates } from "@/lib/route";

type MapViewProps = {
  pickupCoords?: Coordinates | null;
  dropoffCoords?: Coordinates | null;
  routeGeometry?: GeoJSON.LineString | null;
};

export default function MapView({
  pickupCoords = null,
  dropoffCoords = null,
  routeGeometry = null,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!token || !mapContainerRef.current) {
      console.error("Mapbox access token is missing.");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [75.04, 12.91],
      zoom: 12,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      if (!map.getSource("goride-route")) {
        map.addSource("goride-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        });

        map.addLayer({
          id: "goride-route-line",
          type: "line",
          source: "goride-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#2563eb",
            "line-width": 5,
          },
        });
      }
    });

    return () => {
      pickupMarkerRef.current?.remove();
      dropoffMarkerRef.current?.remove();
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!pickupCoords) {
      pickupMarkerRef.current?.remove();
      pickupMarkerRef.current = null;
    } else if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = new mapboxgl.Marker({
        color: "#16a34a",
      })
        .setLngLat([pickupCoords.longitude, pickupCoords.latitude])
        .addTo(map);
    } else {
      pickupMarkerRef.current.setLngLat([
        pickupCoords.longitude,
        pickupCoords.latitude,
      ]);
    }

    if (!dropoffCoords) {
      dropoffMarkerRef.current?.remove();
      dropoffMarkerRef.current = null;
    } else if (!dropoffMarkerRef.current) {
      dropoffMarkerRef.current = new mapboxgl.Marker({
        color: "#dc2626",
      })
        .setLngLat([dropoffCoords.longitude, dropoffCoords.latitude])
        .addTo(map);
    } else {
      dropoffMarkerRef.current.setLngLat([
        dropoffCoords.longitude,
        dropoffCoords.latitude,
      ]);
    }

    const updateRoute = () => {
      const source = map.getSource("goride-route") as
        | mapboxgl.GeoJSONSource
        | undefined;

      source?.setData({
        type: "Feature",
        properties: {},
        geometry: routeGeometry ?? {
          type: "LineString",
          coordinates: [],
        },
      });

      if (routeGeometry && routeGeometry.coordinates.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();

        routeGeometry.coordinates.forEach((coordinate) => {
          bounds.extend([
            coordinate[0],
            coordinate[1],
          ]);
        });

        map.fitBounds(bounds, {
          padding: 70,
          maxZoom: 15,
          duration: 800,
        });
      } else if (pickupCoords && dropoffCoords) {
        map.fitBounds(
          [
            [
              Math.min(pickupCoords.longitude, dropoffCoords.longitude),
              Math.min(pickupCoords.latitude, dropoffCoords.latitude),
            ],
            [
              Math.max(pickupCoords.longitude, dropoffCoords.longitude),
              Math.max(pickupCoords.latitude, dropoffCoords.latitude),
            ],
          ],
          { padding: 70, maxZoom: 15, duration: 800 }
        );
      } else if (pickupCoords) {
        map.flyTo({
          center: [pickupCoords.longitude, pickupCoords.latitude],
          zoom: 14,
          duration: 800,
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateRoute();
    } else {
      map.once("load", updateRoute);
    }
  }, [pickupCoords, dropoffCoords, routeGeometry]);

  return (
    <div
      ref={mapContainerRef}
      className="h-full min-h-[620px] w-full overflow-hidden rounded-2xl"
      aria-label="Interactive GoRide route map"
    />
  );
}
