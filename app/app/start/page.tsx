"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function StartPage() {
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [niches, setNiches] = useState("");
  const [bio, setBio] = useState("");
  const [result, setResult] = useState<{ sellerId: string; adminKey: string } | null>(null);
  const [error, setError] = useState("");

  const startSeller = useMutation(api.sellers.startSeller);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await startSeller({
        handle,
        email: email || undefined,
        niches: niches.split(",").map(n => n.trim()).filter(Boolean),
        bio: bio || undefined,
      });
      setResult(res as any);

      // Store in localStorage if DEV_MODE
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        localStorage.setItem("adminKey", (res as any).adminKey);
        localStorage.setItem("handle", handle);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = () => {
    if (result?.adminKey) {
      navigator.clipboard.writeText(result.adminKey);
      alert("Admin key copied to clipboard!");
    }
  };

  if (result) {
    return (
      <main className="container mx-auto p-8 max-w-2xl">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-4 text-green-800">Success! 🎉</h1>
          <p className="mb-6 text-lg">Your seller account has been created.</p>

          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-2 text-yellow-800">⚠️ IMPORTANT - Save Your Admin Key</h2>
            <p className="mb-4 text-sm">
              This is your <strong>admin key</strong>. You will need it to update your profile and complete lessons.
              Store it safely - you won't see it again!
            </p>
            <div className="bg-white p-4 rounded font-mono text-sm break-all mb-4">
              {result.adminKey}
            </div>
            <button
              onClick={copyToClipboard}
              className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700"
            >
              Copy to Clipboard
            </button>
            {process.env.NEXT_PUBLIC_DEV_MODE === "true" && (
              <p className="mt-4 text-xs text-green-600">
                ✓ DEV MODE: Key automatically saved to localStorage
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p><strong>Seller ID:</strong> {result.sellerId}</p>
            <p><strong>Handle:</strong> @{handle}</p>
          </div>

          <div className="mt-6">
            <a href="/lessons" className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 inline-block">
              Start Learning →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-4">Start Your Journey</h1>
      <p className="mb-6 text-gray-600">
        Create your seller account to access lessons, opportunities, and get certified.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-500 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-2">
            Handle <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="yourhandle"
            required
            className="w-full border rounded px-4 py-2"
          />
          <p className="text-sm text-gray-500 mt-1">Your unique identifier on the platform</p>
        </div>

        <div>
          <label className="block font-semibold mb-2">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Niches <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={niches}
            onChange={(e) => setNiches(e.target.value)}
            placeholder="SaaS, E-commerce, Consulting"
            required
            className="w-full border rounded px-4 py-2"
          />
          <p className="text-sm text-gray-500 mt-1">Comma-separated list of your niches</p>
        </div>

        <div>
          <label className="block font-semibold mb-2">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={4}
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 font-semibold"
        >
          Create Account
        </button>
      </form>
    </main>
  );
}
