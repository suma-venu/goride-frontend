
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to connect to backend");
        }
        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setMessage("Could not connect to backend. Please check the server.");
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="mb-4 text-3xl font-bold">
          GoRide
        </h1>

        <p className="text-gray-600">
          {message}
        </p>
      </div>
    </main>
  );
}
