"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <h1 className="text-xl font-bold">Educational Game Platform</h1>
        <div className="flex items-center gap-4">
          {isAuthenticated && currentUser && (
            <>
              {/* Role-based navigation */}
              {(currentUser.role === "teacher" || currentUser.role === "admin") && (
                <Link
                  href="/invite"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                >
                  Invite Users
                </Link>
              )}
              {currentUser.role === "admin" && (
                <Link
                  href="/admin"
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                >
                  User Management
                </Link>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentUser.name || currentUser.email} ({currentUser.role})
              </span>
            </>
          )}
          <SignOutButton />
        </div>
      </header>
      <main className="p-8 flex flex-col gap-8">
        <Content />
      </main>
    </>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <Link
        href="/signin"
        className="bg-foreground text-background px-4 py-2 rounded-md hover:opacity-80 transition-opacity"
      >
        Sign In
      </Link>
    );
  }

  return (
    <button
      className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-3 py-1 hover:opacity-80 transition-opacity"
      onClick={() =>
        void signOut().then(() => {
          router.push("/signin");
        })
      }
    >
      Sign out
    </button>
  );
}

function Content() {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  // Show loading state
  if (isAuthenticated && currentUser === undefined) {
    return (
      <div className="flex justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Show welcome content for authenticated users
  if (isAuthenticated && currentUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Welcome, {currentUser.name || currentUser.email}!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            {currentUser.role === "student" && "Join games using codes or browse available games"}
            {currentUser.role === "teacher" && "Create games, manage students, and track progress"}
            {currentUser.role === "admin" && "Manage users, oversee the platform, and configure settings"}
          </p>
        </div>

        {/* Game Code Entry Section */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 mb-8 border border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-center mb-6">Join a Game</h2>
          <div className="max-w-md mx-auto">
            <GameCodeEntry />
          </div>
        </div>

        {/* Dashboard based on role */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentUser.role === "student" && (
            <>
              <DashboardCard
                title="Single Player Games"
                description="Practice and improve your skills"
                href="/games/single-player"
                color="bg-blue-500"
              />
              <DashboardCard
                title="My Progress"
                description="View your learning progress and scores"
                href="/progress"
                color="bg-green-500"
              />
              <DashboardCard
                title="Game History"
                description="Review past games and achievements"
                href="/history"
                color="bg-purple-500"
              />
            </>
          )}

          {(currentUser.role === "teacher" || currentUser.role === "admin") && (
            <>
              <DashboardCard
                title="Create Game"
                description="Create new games for your students"
                href="/games/create"
                color="bg-green-500"
              />
              <DashboardCard
                title="My Games"
                description="Manage your created games"
                href="/games/manage"
                color="bg-blue-500"
              />
              <DashboardCard
                title="Analytics"
                description="View student performance and engagement"
                href="/analytics"
                color="bg-purple-500"
              />
            </>
          )}

          {currentUser.role === "admin" && (
            <>
              <DashboardCard
                title="Platform Analytics"
                description="View overall platform usage and metrics"
                href="/admin/analytics"
                color="bg-orange-500"
              />
              <DashboardCard
                title="System Settings"
                description="Configure platform settings"
                href="/admin/settings"
                color="bg-red-500"
              />
            </>
          )}
        </div>
      </div>
    );
  }

  // Show public landing page for unauthenticated users
  return (
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-5xl font-bold mb-6">Educational Game Platform</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
        Join interactive learning games or create your own educational experiences
      </p>

      {/* Game Code Entry for Public Users */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 mb-8 border border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold mb-6">Join a Game</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Have a game code? Enter it below to join the fun!
        </p>
        <div className="max-w-md mx-auto">
          <GameCodeEntry />
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">For Students</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Join multiplayer games, compete with classmates, and track your learning progress
          </p>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">For Teachers</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create engaging games, manage student progress, and make learning fun
          </p>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">For Administrators</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, oversee platform usage, and configure system settings
          </p>
        </div>
      </div>
    </div>
  );
}

function GameCodeEntry() {
  const [gameCode, setGameCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameCode.length === 8) {
      router.push(`/game/${gameCode.toUpperCase()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        value={gameCode}
        onChange={(e) => setGameCode(e.target.value.toUpperCase())}
        placeholder="Enter 8-character game code"
        maxLength={8}
        className="bg-background text-foreground rounded-md p-4 border-2 border-slate-200 dark:border-slate-800 text-center text-xl font-mono tracking-widest uppercase"
        pattern="[A-Z0-9]{8}"
        required
      />
      <button
        type="submit"
        disabled={gameCode.length !== 8}
        className="bg-foreground text-background rounded-md p-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        Join Game
      </button>
    </form>
  );
}

function DashboardCard({ title, description, href, color }: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} className="group">
      <div className={`${color} rounded-lg p-6 text-white hover:opacity-90 transition-opacity`}>
        <h3 className="text-xl font-bold mb-2 group-hover:translate-x-1 transition-transform">
          {title}
        </h3>
        <p className="text-white/80">
          {description}
        </p>
      </div>
    </Link>
  );
}

