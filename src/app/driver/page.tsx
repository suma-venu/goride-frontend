
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

type Ride = {
  id: number;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  driver_id: string | null;
};

export default function DriverDashboard() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyRideId, setBusyRideId] = useState<number | null>(null);

  const loadRides = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");

      const response = await fetch(
        "http://localhost:5000/api/driver/rides",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not load rides.");
      }

      setRides(data.rides ?? []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not load rides."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void loadRides();
    }
  }, [isLoaded, isSignedIn, loadRides]);

  async function completeRide(rideId: number) {
    setBusyRideId(rideId);
    setMessage("");

    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");

      const response = await fetch(
        `http://localhost:5000/api/rides/${rideId}/complete`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not complete ride.");
      }

      setMessage(`Ride ${rideId} completed successfully.`);
      await loadRides();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not complete ride."
      );
    } finally {
      setBusyRideId(null);
    }
  }

  if (!isLoaded) {
    return <main className="p-6">Loading...</main>;
  }

  if (!isSignedIn) {
    return <main className="p-6">Please sign in to view the driver dashboard.</main>;
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">GoRide Driver Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your assigned trips.
          </p>
        </div>
        <button
          onClick={() => void loadRides()}
          disabled={loading}
          className="rounded-lg border px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {message && (
        <p role="status" className="mb-4 rounded-lg bg-gray-100 p-3">
          {message}
        </p>
      )}

      {rides.length === 0 ? (
        <div className="rounded-xl border p-6">
          No rides assigned to this account yet.
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <article key={ride.id} className="rounded-xl border p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Ride #{ride.id}</h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                  {ride.status}
                </span>
              </div>

              <p><strong>Pickup:</strong> {ride.pickup_location}</p>
              <p className="mt-2">
                <strong>Destination:</strong> {ride.dropoff_location}
              </p>

              {ride.status === "assigned" && (
                <button
                  onClick={() => void completeRide(ride.id)}
                  disabled={busyRideId !== null}
                  className="mt-4 rounded-lg bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
                >
                  {busyRideId === ride.id ? "Completing..." : "Complete Ride"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
