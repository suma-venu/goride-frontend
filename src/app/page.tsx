

"use client";

import { useEffect, useState } from "react";

import { searchPlaces } from "@/lib/geocode";

import type { PlaceSuggestion, Coordinates } from "@/lib/geocode";

import { getRoute } from "@/lib/route";

import type { RouteEstimate } from "@/lib/route";

import {

  Show,

  SignInButton,

  UserButton,

  useAuth,

  useUser,

} from "@clerk/nextjs";

import MapView from "@/components/MapView";

const API_URL = "http://localhost:5000/api/profile";

export default function Home() {

  const { isLoaded, isSignedIn, user } = useUser();

  const { getToken } = useAuth();

  const [pickup, setPickup] = useState("");

  const [destination, setDestination] = useState("");

  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);

const [dropoffSuggestions, setDropoffSuggestions] = useState<PlaceSuggestion[]>([]);

const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);

const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);

const [activeSearch, setActiveSearch] = useState<"pickup" | "dropoff" | null>(null);

  const [rideType, setRideType] = useState("GoRide Economy");

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [fullName, setFullName] = useState("");

  const [phone, setPhone] = useState("");

  const [profileMessage, setProfileMessage] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [routeEstimate, setRouteEstimate] =

  useState<RouteEstimate | null>(null);

const [isCheckingRide, setIsCheckingRide] = useState(false);

const [rideError, setRideError] = useState("");

const [bookingMessage, setBookingMessage] = useState("");

const [isBooking, setIsBooking] = useState(false);

const [bookedRideId, setBookedRideId] = useState<number | null>(null);

  useEffect(() => {

    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;

    async function loadProfile() {

      setIsLoadingProfile(true);

      try {

        const token = await getToken();

        if (!token) {

          throw new Error("Please sign in again.");

        }

        const response = await fetch(API_URL, {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        });

        const data = await response.json();

        if (!response.ok) {

          throw new Error(data.message || "Could not load profile.");

        }

        if (!cancelled) {

          const profile = data.profile ?? data;

          setFullName(profile.full_name || user?.fullName || "");

          setPhone(profile.phone || "");

        }

      } catch (error) {

        if (!cancelled) {

          console.error("Profile loading failed:", error);

        }

      } finally {

        if (!cancelled) {

          setIsLoadingProfile(false);

        }

      }

    }

    loadProfile();

    return () => {

      cancelled = true;

    };

  }, [isLoaded, isSignedIn, getToken, user]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();

    setIsSaving(true);

    setProfileMessage("");

    try {

      const token = await getToken();

      if (!token) {

        throw new Error("Please sign in again.");

      }

      const response = await fetch(API_URL, {

        method: "PATCH",

        headers: {

          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify({

          full_name: fullName.trim(),

          phone: phone.trim(),

        }),

      });

      const data = await response.json();

      if (!response.ok) {

        throw new Error(data.message || "Could not update your profile.");

      }

      setProfileMessage("Profile updated successfully!");

    } catch (error) {

      setProfileMessage(

        error instanceof Error

          ? error.message

          : "Could not update your profile."

      );

    } finally {

      setIsSaving(false);

    }

  }

  useEffect(() => {

  if (!activeSearch) return;

  const query = activeSearch === "pickup" ? pickup : destination;

  if (query.trim().length < 3) {

    if (activeSearch === "pickup") setPickupSuggestions([]);

    else setDropoffSuggestions([]);

    return;

  }

  let cancelled = false;

  const timer = setTimeout(async () => {

    try {

      const results = await searchPlaces(query);

      if (!cancelled) {

        if (activeSearch === "pickup") setPickupSuggestions(results);

        else setDropoffSuggestions(results);

      }

    } catch (error) {

      console.error("Location autocomplete failed:", error);

    }

  }, 350);

  return () => {

    cancelled = true;

    clearTimeout(timer);

  };

}, [pickup, destination, activeSearch]);

async function checkRide() {

  if (!pickupCoords || !dropoffCoords) {

    setRideError("Select a pickup and destination from the suggestions.");

    return;

  }

  setIsCheckingRide(true);

  setRideError("");

  setRouteEstimate(null);

  setBookingMessage("");

  try {

    const estimate = await getRoute(pickupCoords, dropoffCoords);

    setRouteEstimate(estimate);

  } catch (error) {

    setRideError(

      error instanceof Error ? error.message : "Unable to calculate this route."

    );

  } finally {

    setIsCheckingRide(false);

  }

}

async function bookRide() {

  if (!pickup.trim() || !destination.trim() || !routeEstimate) {

    setBookingMessage("Please check your route before booking.");

    return;

  }

  if (!isSignedIn) {

    setBookingMessage("Please sign in to book this ride.");

    return;

  }

  setIsBooking(true);

  setBookingMessage("");

  try {

    const token = await getToken();

    if (!token) {

      throw new Error("Your session has expired. Please sign in again.");

    }

    const response = await fetch("http://localhost:5000/api/rides", {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,

      },

      body: JSON.stringify({

        pickup_location: pickup.trim(),

        dropoff_location: destination.trim(),

        ride_type: rideType,

        distance_km: routeEstimate.distanceKm,

      }),

    });

    const data = await response.json();

    if (!response.ok) {

      throw new Error(data.message || "Could not book your ride.");

    }

  setBookedRideId(Number(data.ride.id));

setBookingMessage(
  `Ride requested successfully! Booking ID: ${data.ride.id}`
);

  } catch (error) {

    setBookingMessage(

      error instanceof Error ? error.message : "Could not book your ride."

    );

  } finally {
    setIsBooking(false);
  }
}

async function assignDriver(rideId: number) {

  try {

    const token = await getToken();

    if (!token) {

      setBookingMessage("Please sign in again.");

      return;

    }

    const response = await fetch(

      `http://localhost:5000/api/rides/${rideId}/assign-driver`,

      {

        method: "POST",

        headers: {

          Authorization: `Bearer ${token}`,

          "Content-Type": "application/json",

        },

      }

    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(

        data.message || data.error || "Driver assignment failed."

      );

    }

    setBookingMessage(

      `Driver assigned successfully to ride ${data.ride.id}.`

    );

  } catch (error) {

    setBookingMessage(

      error instanceof Error

        ? error.message

        : "Driver assignment failed."

    );

  }

}

  return (

    <main className="min-h-screen bg-white text-gray-900">

      {/* Navbar */}

      <header className="flex items-center justify-between bg-black px-5 py-4 text-white sm:px-8">

        <a href="#" className="text-2xl font-bold tracking-tight">

          GoRide

        </a>

        <nav className="flex items-center gap-3 sm:gap-6">

          <a href="#book" className="text-sm hover:text-gray-300">

            Ride

          </a>

          <a

            href="#places"

            className="hidden text-sm hover:text-gray-300 sm:block"

          >

            Saved places

          </a>

          {isLoaded && (

            <>

              <Show when="signed-out">

                <SignInButton mode="modal">

                  <button

                    type="button"

                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200"

                  >

                    Sign In

                  </button>

                </SignInButton>

              </Show>

              <Show when="signed-in">

                <div className="flex items-center gap-2">

                  <span className="hidden text-sm sm:inline">

                    {user?.firstName || "Account"}

                  </span>

                  <UserButton />

                  <button

                    type="button"

                   onClick={() => setIsProfileOpen(true)}

                    className="rounded-full bg-white px-3 py-2 text-sm font-medium text-black hover:bg-gray-200 sm:px-4"

                  >

                    Profile

                  </button>

                </div>

              </Show>

            </>

          )}

        </nav>

      </header>

      {/* Booking area */}

      <section

        id="book"

        className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:py-12"

      >

        <div className="order-2 lg:order-1">

          <p className="mb-3 text-sm font-medium text-gray-500">

            GO WHERE YOU NEED

          </p>

          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">

            Go anywhere.

          </h2>

          <p className="mt-3 max-w-md text-gray-600">

            Your ride is just a few steps away.

          </p>

          <div className="mt-8 max-w-lg space-y-4">

            <div className="relative">

  <label htmlFor="pickup" className="mb-2 block text-sm font-medium">

    Pickup location

  </label>

  <input

    id="pickup"

    value={pickup}

    autoComplete="off"

    onFocus={() => setActiveSearch("pickup")}

    onChange={(event) => {

      setPickup(event.target.value);

      setPickupCoords(null);

      setRouteEstimate(null);

      setPickupSuggestions([]);

      setActiveSearch("pickup");

    }}

    placeholder="Search pickup location"

    className="w-full rounded-xl border border-gray-300 px-4 py-4 outline-none focus:border-black"

  />

  {activeSearch === "pickup" && pickupSuggestions.length > 0 && (

    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">

      {pickupSuggestions.map((place) => (

        <button

          key={place.id}

          type="button"

          className="block w-full border-b px-4 py-3 text-left hover:bg-gray-100"

          onClick={() => {

            setPickup(place.fullAddress);

            setPickupCoords({

              longitude: place.longitude,

              latitude: place.latitude,

            });

            setPickupSuggestions([]);

            setActiveSearch(null);

            setRouteEstimate(null);

          }}

        >

          <span className="block font-medium">{place.name}</span>

          <span className="text-sm text-gray-500">{place.fullAddress}</span>

        </button>

      ))}

    </div>

  )}

</div>

<div className="relative">

  <label

    htmlFor="destination"

    className="mb-2 block text-sm font-medium"

  >

    Drop-off location

  </label>

  <input

    id="destination"

    value={destination}

    autoComplete="off"

    onFocus={() => setActiveSearch("dropoff")}

    onChange={(event) => {

      setDestination(event.target.value);

      setDropoffCoords(null);

      setRouteEstimate(null);

      setDropoffSuggestions([]);

      setActiveSearch("dropoff");

    }}

    placeholder="Search destination"

    className="w-full rounded-xl border border-gray-300 px-4 py-4 outline-none focus:border-black"

  />

  {activeSearch === "dropoff" && dropoffSuggestions.length > 0 && (

    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">

      {dropoffSuggestions.map((place) => (

        <button

          key={place.id}

          type="button"

          className="block w-full border-b px-4 py-3 text-left hover:bg-gray-100"

          onClick={() => {

            setDestination(place.fullAddress);

            setDropoffCoords({

              longitude: place.longitude,

              latitude: place.latitude,

            });

            setDropoffSuggestions([]);

            setActiveSearch(null);

            setRouteEstimate(null);

          }}

        >

          <span className="block font-medium">{place.name}</span>

          <span className="text-sm text-gray-500">

            {place.fullAddress}

          </span>

        </button>

      ))}

    </div>

  )}

</div>

            <div>

              <label

                htmlFor="rideType"

                className="mb-2 block text-sm font-medium"

              >

                Choose your ride

              </label>

              <select

                id="rideType"

                value={rideType}

                onChange={(event) => setRideType(event.target.value)}

                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-4 outline-none focus:border-black"

              >

                <option>GoRide Economy</option>

                <option>GoRide Comfort</option>

                <option>GoRide XL</option>

              </select>

            </div>

            <button

  type="button"

  onClick={checkRide}

  disabled={isCheckingRide}

  className="w-full rounded-xl bg-black px-5 py-4 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"

>

  {isCheckingRide ? "Checking route..." : "Check ride"}

</button>

{rideError && (

  <p role="alert" className="mt-3 text-sm text-red-600">

    {rideError}

  </p>

)}

{routeEstimate && (

  <div className="mt-4 rounded-xl border border-gray-200 p-4">

    <h3 className="font-semibold">Your route</h3>

    <p className="mt-2 text-sm text-gray-600">

      Distance: {routeEstimate.distanceKm.toFixed(1)} km

    </p>

    <p className="text-sm text-gray-600">

      Estimated driving time:{" "}

      {Math.round(routeEstimate.durationMinutes)} minutes

    </p>

    <div className="mt-4 space-y-2">

      {[

        { name: "GoRide Economy", multiplier: 1 },

        { name: "GoRide Comfort", multiplier: 1.5 },

        { name: "GoRide XL", multiplier: 1.8 },

      ].map((ride) => {

        const fare = Math.round(

          (40 + routeEstimate.distanceKm * 15) * ride.multiplier

        );

        return (

          <button

            key={ride.name}

            type="button"

            onClick={() => setRideType(ride.name)}

            className={`flex w-full items-center justify-between rounded-lg border p-3 text-left ${

              rideType === ride.name

                ? "border-black bg-gray-100"

                : "border-gray-200"

            }`}

          >

            <span className="font-medium">{ride.name}</span>

            <span className="font-semibold">₹{fare}</span>

          </button>

        );

      })}

    </div>

<button

  type="button"

  onClick={bookRide}

  disabled={isBooking}

  className="mt-4 w-full rounded-xl bg-black px-5 py-4 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"

>

  {isBooking

    ? "Requesting ride..."

    : isSignedIn

      ? "Book this ride"

      : "Sign in to book"}

</button>

<button
  type="button"
  onClick={() => {
    if (bookedRideId === null) {
      setBookingMessage("Please book a ride first.");
      return;
    }

    assignDriver(bookedRideId);
  }}
  disabled={bookedRideId === null}
  className="mt-3 w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
>
  {bookedRideId === null
    ? "Book a ride first"
    : `Assign Driver to Ride ${bookedRideId}`}
</button>

{bookingMessage && (

  <p role="status" className="mt-3 text-sm">

    {bookingMessage}

  </p>

)}

    <p className="mt-3 text-xs text-gray-500">

      Demo fare only. Actual prices may differ.

    </p>

  </div>

)}

            <p className="text-xs text-gray-500">

              Your ride requests are saved securely in Supabase.

            </p>

          </div>

          <div id="places" className="mt-8 border-t border-gray-200 pt-6">

            <h3 className="font-semibold">Saved places</h3>

            <div className="mt-4 flex flex-wrap gap-3">

              <button

                type="button"

                onClick={() => setPickup("Home")}

                className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"

              >

                Home

              </button>

              <button

                type="button"

                onClick={() => setPickup("Work")}

                className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"

              >

                Work

              </button>

            </div>

          </div>

        </div>

        {/* Mapbox map */}

        <div className="order-1 min-h-64 overflow-hidden rounded-2xl bg-gray-100 lg:order-2 lg:min-h-620px">

         <MapView

  pickupCoords={pickupCoords}

  dropoffCoords={dropoffCoords}

  routeGeometry={routeEstimate?.geometry ?? null}

/>

        </div>

      </section>

      {/* Profile editor */}

      {isProfileOpen && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"

          onClick={() => setIsProfileOpen(false)}

        >

          <div

            role="dialog"

            aria-modal="true"

            aria-labelledby="profile-title"

            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="mb-6 flex items-center justify-between">

              <h2 id="profile-title" className="text-xl font-bold">

                Your profile

              </h2>

              <button

                type="button"

                aria-label="Close profile"

                onClick={() => setIsProfileOpen(false)}

                className="rounded-full px-3 py-2 text-gray-500 hover:bg-gray-100"

              >

                ✕

              </button>

            </div>

            {isLoadingProfile ? (

              <p className="text-sm text-gray-500">Loading profile...</p>

            ) : (

              <form onSubmit={saveProfile} className="space-y-4">

                <div>

                  <label

                    htmlFor="fullName"

                    className="mb-2 block text-sm font-medium"

                  >

                    Full name

                  </label>

                  <input

                    id="fullName"

                    required

                    value={fullName}

                    onChange={(event) => setFullName(event.target.value)}

                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"

                    placeholder="Enter your full name"

                  />

                </div>

                <div>

                  <label

                    htmlFor="phone"

                    className="mb-2 block text-sm font-medium"

                  >

                    Phone number

                  </label>

                  <input

                    id="phone"

                    type="tel"

                    required

                    value={phone}

                    onChange={(event) => setPhone(event.target.value)}

                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"

                    placeholder="Enter your phone number"

                  />

                </div>

                {profileMessage && (

                  <p

                    role="status"

                    className={`text-sm ${

                      profileMessage.includes("successfully")

                        ? "text-green-700"

                        : "text-red-600"

                    }`}

                  >

                    {profileMessage}

                  </p>

                )}

                <button

                  type="submit"

                  disabled={isSaving}

                  className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"

                >

                  {isSaving ? "Saving..." : "Save changes"}

                </button>

              </form>

            )}

          </div>

        </div>

      )}

      <footer className="border-t border-gray-200 px-5 py-6 text-center text-sm text-gray-500 sm:px-8">

        © {new Date().getFullYear()} GoRide. Your journey, simplified.

      </footer>

    </main>

  );

}
