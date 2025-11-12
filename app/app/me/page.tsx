"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";

export default function MePage() {
  const [adminKey, setAdminKey] = useState("");
  const [niches, setNiches] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const updateProfile = useMutation(api.sellers.updateProfile);

  useEffect(() => {
    // Try to load adminKey from localStorage in DEV_MODE
    if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
      const stored = localStorage.getItem("adminKey");
      if (stored) {
        setAdminKey(stored);
      }
    }

    // Check for adminKey in URL query params
    const params = new URLSearchParams(window.location.search);
    const keyFromUrl = params.get("adminKey");
    if (keyFromUrl) {
      setAdminKey(keyFromUrl);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      await updateProfile({
        adminKey,
        niches: niches ? niches.split(",").map(n => n.trim()).filter(Boolean) : undefined,
        bio: bio || undefined,
        email: email || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-4">My Profile</h1>
      <p className="mb-6 text-gray-600">
        Update your profile information using your admin key.
      </p>

      {success && (
        <div className="bg-green-50 border border-green-500 text-green-700 p-4 rounded mb-4">
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-500 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-2">
            Admin Key <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="sk_..."
            required
            className="w-full border rounded px-4 py-2 font-mono text-sm"
          />
          {process.env.NEXT_PUBLIC_DEV_MODE === "true" && adminKey && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Loaded from localStorage
            </p>
          )}
        </div>

        <div>
          <label className="block font-semibold mb-2">Niches</label>
          <input
            type="text"
            value={niches}
            onChange={(e) => setNiches(e.target.value)}
            placeholder="SaaS, E-commerce, Consulting"
            className="w-full border rounded px-4 py-2"
          />
          <p className="text-sm text-gray-500 mt-1">Comma-separated list</p>
        </div>

        <div>
          <label className="block font-semibold mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={4}
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 font-semibold"
        >
          Update Profile
        </button>
      </form>
    </main>
  );
}
