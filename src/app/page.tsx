
"use client";

import { useEffect, useState } from "react";
import { Show, UserButton, useAuth, useUser } from "@clerk/nextjs";

export default function Home() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    let cancelled = false;

    async function loadProfile() {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch("http://localhost:5000/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Could not load profile.");
        }

        if (!cancelled) {
          setFullName(
            result.profile?.full_name || user?.fullName || ""
          );
          setPhone(result.profile?.phone || "");
        }
      } catch (error) {
        console.error("Profile loading failed:", error);
        if (!cancelled) {
          setProfileMessage("Could not load your saved profile.");
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, user]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setProfileMessage("");

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Please sign in again.");
      }

      const response = await fetch("http://localhost:5000/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          phone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save your profile.");
      }

      setFullName(result.profile.full_name || "");
      setPhone(result.profile.phone || "");
      setProfileMessage("Profile saved successfully!");
      setIsProfileOpen(false);
    } catch (error) {
      setProfileMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        Loading GoRide...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <header className="flex items-center justify-between bg-black px-5 py-4 text-white sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight">GoRide</h1>

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

          <Show when="signed-in">
            <div className="flex items-center gap-2">
              <span className="hidden text-sm sm:inline">
                {user?.firstName || "Account"}
              </span>

              <UserButton />

              <button
                type="button"
                onClick={() => {
                  setProfileMessage("");
                  setIsProfileOpen(true);
                }}
                className="rounded-full bg-white px-3 py-2 text-sm font-medium text-black hover:bg-gray-200 sm:px-4"
              >
                Profile
              </button>
            </div>
          </Show>
        </nav>
      </header>

      {/* Main content */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-6 sm:px-8 sm:py-10 lg:grid-cols-2 lg:gap-12">
        {/* Booking panel */}
        <div id="book" className="order-2 lg:order-1">
          <p className="text-sm font-medium text-gray-500">
            YOUR EVERYDAY RIDE
          </p>

          <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Go anywhere.
          </h2>

          <p className="mt-3 text-gray-600">
            Your journey starts here.
          </p>

          <div className="mt-8 max-w-xl">
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="pickup"
            >
              Pickup location
            </label>

            <input
              id="pickup"
              value={pickup}
              onChange={(event) => setPickup(event.target.value)}
              placeholder="Enter pickup location"
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-4 outline-none transition focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
            />

            <label
              className="mb-2 mt-5 block text-sm font-medium"
              htmlFor="destination"
            >
              Destination
            </label>

            <input
              id="destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Where would you like to go?"
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-4 outline-none transition focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
            />

            <button
              type="button"
              disabled={!pickup.trim() || !destination.trim()}
              className="mt-5 w-full rounded-lg bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto sm:min-w-48"
              onClick={() =>
                alert(
                  "Ride booking will be enabled when we build the booking feature."
                )
              }
            >
              See ride options
            </button>
          </div>

          {/* Saved places */}
          <div id="places" className="mt-10">
            <h3 className="text-lg font-semibold">Saved places</h3>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDestination("Home")}
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:bg-gray-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <span aria-hidden="true">⌂</span>
                </span>

                <span>
                  <span className="block font-medium">Home</span>
                  <span className="text-sm text-gray-500">
                    Add destination
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDestination("Work")}
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:bg-gray-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <span aria-hidden="true">▦</span>
                </span>

                <span>
                  <span className="block font-medium">Work</span>
                  <span className="text-sm text-gray-500">
                    Add destination
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="order-1 min-h-64 overflow-hidden rounded-2xl bg-gray-100 lg:order-2 lg:min-h-[620px]">
          <div className="flex h-full min-h-64 flex-col items-center justify-center p-6 text-center lg:min-h-[620px]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" />
                <path d="M9 3v15M15 6v15" />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-semibold">Your map goes here</h3>

            <p className="mt-2 max-w-xs text-sm text-gray-500">
              We&apos;ll add interactive maps and pickup selection in the next
              stage.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 px-5 py-6 text-center text-sm text-gray-500">
        GoRide © 2026 · Your Ride, Your Way.
      </footer>

      {/* Profile editor modal */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsProfileOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="profile-title" className="text-2xl font-bold">
                  Your profile
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update your personal details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                aria-label="Close profile editor"
                className="rounded-full px-3 py-1 text-xl hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveProfile} className="space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  maxLength={100}
                  autoComplete="name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  maxLength={20}
                  autoComplete="tel"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black focus:ring-1 focus:ring-black"
                  placeholder="Enter your phone number"
                />
              </div>

              {profileMessage && (
                <p role="status" className="text-sm text-red-600">
                  {profileMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
