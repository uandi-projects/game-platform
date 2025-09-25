"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, use } from "react";
import Link from "next/link";
import { Loader } from "@/components/ui/loader";

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [username, setUsername] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const resolvedParams = use(params);
  const gameCode = resolvedParams.code.toUpperCase();

  // Validate game code format
  if (!/^[A-Z0-9]{8}$/.test(gameCode)) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Invalid Game Code</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Game codes must be exactly 8 characters long and contain only letters and numbers.
          </p>
          <Link
            href="/"
            className="bg-foreground text-background px-6 py-2 rounded-md hover:opacity-80 transition-opacity"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const handleJoinGame = async () => {
    setIsJoining(true);
    try {
      // TODO: Implement game joining logic
      // For now, just simulate joining
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Joined game ${gameCode}!`);
    } catch (error) {
      console.error("Error joining game:", error);
      alert("Failed to join game. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  // Show username entry for unauthenticated users
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Join Game</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              Game Code: <span className="font-mono font-bold">{gameCode}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your name to join this game
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleJoinGame(); }} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-background text-foreground rounded-md p-4 border-2 border-slate-200 dark:border-slate-800"
              required
              minLength={2}
              maxLength={30}
              disabled={isJoining}
            />

            <button
              type="submit"
              disabled={isJoining || username.trim().length < 2}
              className="w-full bg-foreground text-background rounded-md p-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {isJoining ? "Joining Game..." : "Join Game"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Already have an account?
            </p>
            <Link
              href="/signin"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show authenticated user game joining interface
  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Join Game</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            Game Code: <span className="font-mono font-bold">{gameCode}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Welcome, <span className="font-semibold">{currentUser.name || currentUser.email}</span>
          </p>
        </div>

        {/* Game info placeholder */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-6 border border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold mb-2">Game Information</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Status: Waiting for players</p>
            <p>• Players: 3/30</p>
            <p>• Game Type: Multiple Choice Quiz</p>
            <p>• Topic: Science Fundamentals</p>
          </div>
        </div>

        <button
          onClick={handleJoinGame}
          disabled={isJoining}
          className="w-full bg-foreground text-background rounded-md p-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mb-4"
        >
          {isJoining ? "Joining Game..." : "Join Game"}
        </button>

        <Link
          href="/"
          className="block text-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}