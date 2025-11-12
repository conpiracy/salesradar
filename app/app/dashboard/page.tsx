"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CRMDashboard } from "@/components/crm-dashboard";

export default function DashboardPage() {
  // Fetch real data from Convex
  const sellers = useQuery(api.sellers.certifiedDirectory);
  const leaderboard = useQuery(api.leaderboard.leaderboard);
  const opportunities = useQuery(api.opportunities.listLatest, { limit: 10 });
  const lessons = useQuery(api.courses.listLessons);

  // Show loading state
  if (!sellers || !leaderboard || !opportunities || !lessons) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // For now, just render the beautiful CRM dashboard
  // TODO: Connect real Convex data to the dashboard component
  return <CRMDashboard />;
}
