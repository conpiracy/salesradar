"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";

export default function OpportunitiesPage() {
  const [handle, setHandle] = useState("");

  const opportunities = useQuery(api.opportunities.listLatest, { limit: 20 });
  const recordClick = useMutation(api.opportunities.recordClick);

  useEffect(() => {
    // Load handle from localStorage in DEV_MODE
    if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
      const stored = localStorage.getItem("handle");
      if (stored) {
        setHandle(stored);
      }
    }
  }, []);

  const handleClick = async (opportunityId: Id<"opportunities">, url: string) => {
    try {
      await recordClick({
        opportunityId,
        sellerHandle: handle || undefined,
      });
      // Open in new tab
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error recording click:", err);
      // Still open the URL even if recording fails
      window.open(url, "_blank");
    }
  };

  return (
    <main className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Opportunities</h1>
      <p className="mb-6 text-gray-600">
        Browse the latest opportunities. Click to view and track your engagement.
      </p>

      <div className="mb-6 bg-gray-50 p-4 rounded">
        <label className="block font-semibold mb-2">Your Handle (optional)</label>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="yourhandle"
          className="w-full border rounded px-4 py-2"
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter your handle to track clicks on the leaderboard
        </p>
        {process.env.NEXT_PUBLIC_DEV_MODE === "true" && handle && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Loaded from localStorage
          </p>
        )}
      </div>

      {!opportunities ? (
        <p>Loading opportunities...</p>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 mb-4">No opportunities yet.</p>
          <p className="text-gray-400">
            Run the seed script to populate with sample opportunities!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp: any) => (
            <div
              key={opp._id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{opp.title}</h2>
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span>Source: {opp.source}</span>
                    <span>Posted: {new Date(opp.postedAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleClick(opp._id, opp.url)}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    View Opportunity →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
