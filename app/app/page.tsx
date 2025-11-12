export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to SalesRadar MVP</h1>
      <p className="mb-6 text-lg">
        A minimal platform for seller onboarding, learning, and opportunity discovery.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
          <p className="mb-4">View your beautiful CRM dashboard with analytics.</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">
            View Dashboard →
          </a>
        </div>
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">Get Started</h2>
          <p className="mb-4">Create your seller account and get your admin key.</p>
          <a href="/start" className="text-blue-600 hover:underline">
            Start Now →
          </a>
        </div>
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">Learn</h2>
          <p className="mb-4">Complete lessons and get certified.</p>
          <a href="/lessons" className="text-blue-600 hover:underline">
            View Lessons →
          </a>
        </div>
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">Opportunities</h2>
          <p className="mb-4">Browse the latest opportunities.</p>
          <a href="/opps" className="text-blue-600 hover:underline">
            Browse Now →
          </a>
        </div>
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">Directory</h2>
          <p className="mb-4">Find certified sellers by niche.</p>
          <a href="/dir" className="text-blue-600 hover:underline">
            Browse Directory →
          </a>
        </div>
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">Leaderboard</h2>
          <p className="mb-4">See top performers ranked by activity.</p>
          <a href="/leaderboard" className="text-blue-600 hover:underline">
            View Leaderboard →
          </a>
        </div>
      </div>
    </main>
  );
}
