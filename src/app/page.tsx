"use client";
import { useEffect, useState } from "react";

import {
  SignInButton,
  SignUpButton,
  UserButton,
  Show,
  useAuth,
} from "@clerk/nextjs";

export default function Home() {
const { getToken, isLoaded, isSignedIn } = useAuth();
const [profileMessage, setProfileMessage] = useState("");

// Fetch the profile after the user signs in
useEffect(() => {
  if (!isLoaded || !isSignedIn) {
    setProfileMessage("");
    return;
  }

  let cancelled = false;

  async function fetchProfile() {
    try {
      setProfileMessage("Loading your GoRide profile...");

      const token = await getToken();

      if (!token) {
        throw new Error("Could not retrieve your session token.");
      }

      const response = await fetch("http://localhost:5000/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load profile.");
      }

      if (!cancelled) {
        setProfileMessage(
          result.profile
            ? "Your GoRide profile is connected to Supabase!"
            : "Profile loaded."
        );
      }
    } catch (error) {
      if (!cancelled) {
        setProfileMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      }
    }
  }

  fetchProfile();

  return () => {
    cancelled = true;
  };
}, [getToken, isLoaded, isSignedIn]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-lg">
        <h1 className="mb-3 text-4xl font-bold text-gray-900">
          GoRide
        </h1>

        <p className="mb-8 text-gray-600">
          Your Ride, Your Way.
        </p>

        <Show when="signed-out">
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <SignInButton mode="modal">
              <button className="rounded-lg bg-black px-6 py-3 font-medium text-white">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-900">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </Show>

        
<Show when="signed-in">
  <div className="flex flex-col items-center gap-4">
    <p className="text-green-700">
      You are signed in to GoRide.
    </p>

    <p className="mt-4 text-sm text-gray-600">
      {profileMessage}
    </p>

    <UserButton />
  </div>
</Show>
 
      </div>
    </main>
  );
}
