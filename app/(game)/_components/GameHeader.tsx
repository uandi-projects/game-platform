"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, Users } from "lucide-react";

interface GameHeaderProps {
  gameName: string;
  gameCode: string;
  timeLeft?: number;
  showTimer?: boolean;
  playerCount?: number;
  showPlayerCount?: boolean;
  exitPath?: string; // Where to go when exiting (defaults to /dashboard)
}

export default function GameHeader({
  gameName,
  gameCode,
  timeLeft,
  showTimer = false,
  playerCount,
  showPlayerCount = false,
  exitPath = '/dashboard'
}: GameHeaderProps) {
  const router = useRouter();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold">{gameName}</h1>
        <p className="text-muted-foreground">Code: {gameCode}</p>
      </div>
      <div className="flex items-center gap-4">
        {showPlayerCount && playerCount !== undefined && (
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>{playerCount}</span>
          </div>
        )}
        {showTimer && timeLeft !== undefined && (
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
          </div>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => router.push(exitPath)}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Exit</span>
        </Button>
      </div>
    </div>
  );
}