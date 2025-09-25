"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/Header";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <div>
      <Header />
      <main className="p-8 flex flex-col gap-8">
        <Content />
      </main>
    </div>
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
        <Loader />
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Join a Game</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              <GameCodeEntry />
            </div>
          </CardContent>
        </Card>
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
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Join a Game</CardTitle>
          <CardDescription>
            Have a game code? Enter it below to join the fun!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto">
            <GameCodeEntry />
          </div>
        </CardContent>
      </Card>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">For Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Join multiplayer games, compete with classmates, and track your learning progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">For Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create engaging games, manage student progress, and make learning fun
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">For Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Manage users, oversee platform usage, and configure system settings
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GameCodeEntry() {
  const [gameCode, setGameCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameCode.length === 6) {
      router.push(`/game/${gameCode.toUpperCase()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        type="text"
        value={gameCode}
        onChange={(e) => setGameCode(e.target.value.toUpperCase())}
        placeholder="Enter 6-character game code"
        maxLength={6}
        className="text-center text-xl font-mono tracking-widest uppercase"
        pattern="[A-Z0-9]{6}"
        required
      />
      <Button
        type="submit"
        disabled={gameCode.length !== 6}
        className="text-lg font-semibold"
        size="lg"
      >
        Join Game
      </Button>
    </form>
  );
}


