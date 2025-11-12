"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DirectoryPage() {
  const sellers = useQuery(api.sellers.certifiedDirectory);

  return (
    <main className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Certified Sellers Directory</h1>
      <p className="mb-6 text-gray-600">
        Browse our directory of certified sellers by niche.
      </p>

      {!sellers ? (
        <p>Loading...</p>
      ) : sellers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 mb-4">No certified sellers yet.</p>
          <p className="text-gray-400">
            Complete all lessons to become the first certified seller!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sellers.map((seller: any) => (
            <div key={seller._id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-semibold">@{seller.handle}</h2>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Certified ✓
                </span>
              </div>

              {seller.bio && (
                <p className="text-gray-700 mb-4">{seller.bio}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {seller.niches.map((niche: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                  >
                    {niche}
                  </span>
                ))}
              </div>

              <p className="text-xs text-gray-500">
                Joined {new Date(seller.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
