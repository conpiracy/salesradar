import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "SalesRadar MVP",
  description: "Seller onboarding and opportunities platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ConvexClientProvider>
          <nav className="bg-gray-800 text-white p-4">
            <div className="container mx-auto flex gap-6">
              <a href="/" className="hover:underline font-bold">SalesRadar</a>
              <a href="/start" className="hover:underline">Start</a>
              <a href="/me" className="hover:underline">My Profile</a>
              <a href="/lessons" className="hover:underline">Lessons</a>
              <a href="/dir" className="hover:underline">Directory</a>
              <a href="/opps" className="hover:underline">Opportunities</a>
              <a href="/leaderboard" className="hover:underline">Leaderboard</a>
            </div>
          </nav>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
