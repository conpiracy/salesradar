"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function LeaderboardPage() {
  const leaderboard = useQuery(api.leaderboard.leaderboard);

  return (
    <main className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Leaderboard</h1>
      <p className="mb-6 text-gray-600">
        Top sellers ranked by activity: 10 points per lesson completed, 1 point per opportunity clicked.
      </p>

      {!leaderboard ? (
        <p>Loading...</p>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 mb-4">No sellers yet.</p>
          <p className="text-gray-400">
            Be the first to create an account and start learning!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Niches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lessons
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((seller: any, index: number) => (
                <tr key={seller._id} className={index < 3 ? "bg-yellow-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          @{seller.handle}
                          {seller.certified && (
                            <span className="ml-2 text-green-600">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {seller.niches.slice(0, 2).map((niche: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800"
                        >
                          {niche}
                        </span>
                      ))}
                      {seller.niches.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{seller.niches.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{seller.lessonsCompleted}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{seller.clicks}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{seller.totalPoints}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
