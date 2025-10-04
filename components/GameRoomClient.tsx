"use client";

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Users, Crown, UserCircle, ExternalLink } from "lucide-react";
import ShareRoomButton from "@/components/ShareRoomButton";
import games from "../games.json";

export default function GameRoomClient({ params }: { params: Promise<{ code: string }> }) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const gameCode = resolvedParams.code.toUpperCase();

  const currentUser = useQuery(api.users.getCurrentUser);
  const gameInstance = useQuery(api.games.getGameInstanceByCode, { code: gameCode });
  const gameParticipants = useQuery(api.games.getGameParticipants, { code: gameCode });

  const joinGame = useMutation(api.games.joinGame);
  const joinGameAsGuest = useMutation(api.games.joinGameAsGuest);
  const startMultiplayerGame = useMutation(api.games.startMultiplayerGame);

  const [guestName, setGuestName] = useState("");
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Load saved guest name from localStorage on mount
  useEffect(() => {
    const savedGuestData = localStorage.getItem(`guest_${gameCode}`);
    if (savedGuestData) {
      try {
        const { name, guestId, joinedAt } = JSON.parse(savedGuestData);
        // Only restore if joined within last 24 hours
        if (Date.now() - joinedAt < 24 * 60 * 60 * 1000) {
          setGuestName(name);
          setGuestId(guestId);
          setHasJoined(true);
        } else {
          // Clean up old data
          localStorage.removeItem(`guest_${gameCode}`);
        }
      } catch (e) {
        console.error("Failed to parse guest data:", e);
      }
    }
  }, [gameCode]);

  // Check if current user has joined
  const currentUserHasJoined = gameParticipants?.allParticipants?.some((participant: any) =>
      (participant?.type === 'authenticated' && participant?.id === currentUser?._id) ||
      (participant?.type === 'guest' && participant?.id === `guest-${guestId}` && hasJoined)
  );

  const isHost = currentUser && gameInstance && currentUser._id === gameInstance.createdBy;

  // Get game info from games.json
  const gameInfo = games.games.find(game => game.id === gameInstance?.gameId);
  const gameTitle = gameInstance?.customConfig?.quizTitle || gameInfo?.name || 'Game';

  // Generate game description based on game type
  const getGameDescription = () => {
    if (gameInstance?.gameId === 'ai-mcq-quiz' && gameInstance?.customConfig) {
      const { questionCount, timeLimit, difficultyLevel } = gameInstance.customConfig;
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs === 0 ? `${mins} minutes` : `${mins}m ${secs}s`;
      };
      return [
        `• ${questionCount || 10} AI-generated questions`,
        `• ${formatTime(timeLimit || 300)} to complete`,
        `• Difficulty level ${difficultyLevel || 10}/20`,
        `• Race against other players!`
      ];
    } else if (gameInstance?.gameId === 'custom-math-race' && gameInstance?.customConfig) {
      const { questionCount, timeLimit } = gameInstance.customConfig;
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs === 0 ? `${mins} minutes` : `${mins}m ${secs}s`;
      };
      return [
        `• ${questionCount || 10} math questions`,
        `• ${formatTime(timeLimit || 180)} to complete`,
        `• Addition and subtraction`,
        `• Race against other players!`
      ];
    }
    // Default
    return [
      `• 10 addition and subtraction questions`,
      `• 3 minutes to complete`,
      `• Race against other players!`
    ];
  };

  // Play bell sound and redirect when game starts
  useEffect(() => {
    if (gameInstance?.status === "active") {
      // Play synthetic bell sound
      try {
        const playBell = () => {
          const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

          // Create a simple bell-like sound
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 1);
        };

        playBell();
      } catch (error) {
        console.log("Could not play bell sound:", error);
      }

      // Redirect to game
      setTimeout(() => {
        router.push(`/game/${gameInstance.gameId}/${gameCode}`);
      }, 1500);
    }
  }, [gameInstance?.status, gameInstance?.gameId, gameCode, router]);

  if (currentUser === undefined || gameInstance === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (gameInstance === null) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Game Not Found</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            No game found with code <span className="font-mono font-bold">{gameCode}</span>
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

  const handleJoinGame = async () => {
    if (!currentUser) return;

    setIsJoining(true);
    try {
      await joinGame({ code: gameCode });
      setHasJoined(true);
    } catch (error) {
      console.error("Error joining game:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinAsGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setIsJoining(true);
    try {
      const result = await joinGameAsGuest({ code: gameCode, guestName: guestName.trim() });
      const returnedGuestId = (result as any).guestId;

      setGuestId(returnedGuestId);
      setHasJoined(true);

      // Save guest name + guestId + game code to localStorage
      localStorage.setItem(`guest_${gameCode}`, JSON.stringify({
        name: guestName.trim(),
        guestId: returnedGuestId,
        joinedAt: Date.now()
      }));
    } catch (error) {
      console.error("Error joining as guest:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartGame = async () => {
    try {
      await startMultiplayerGame({ code: gameCode });
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">
              {gameTitle}
            </CardTitle>
            <p className="text-muted-foreground mb-4">
              Game Code: <span className="font-mono font-bold text-lg">{gameCode}</span>
            </p>
            <div className="flex justify-center">
              <ShareRoomButton gameCode={gameCode} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Game Info */}
            <div className="text-center space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">{gameParticipants?.allParticipants?.length || 0} Players Joined</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {getGameDescription().map((desc, index) => (
                  <p key={index}>{desc}</p>
                ))}
              </div>
            </div>

            {/* Players List */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-center">Players in Room:</h3>
              <div className="space-y-2">
                {gameParticipants?.allParticipants && gameParticipants.allParticipants.length > 0 ? (
                  gameParticipants.allParticipants.map((participant: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {participant?.type === 'authenticated' ? (
                          <UserCircle className="h-5 w-5 text-blue-500" />
                        ) : (
                          <UserCircle className="h-5 w-5 text-gray-500" />
                        )}
                        <span className="font-medium">
                          {participant?.displayName || participant?.name || 'Unknown Player'}
                        </span>
                        {participant?.id === gameInstance.createdBy && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Host
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No players have joined yet
                  </p>
                )}
              </div>
            </div>

            {/* Join Section */}
            {!currentUserHasJoined && (
              <div className="space-y-4">
                {currentUser ? (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Welcome, <span className="font-semibold">{currentUser.name || currentUser.email}</span>!
                    </p>
                    <Button
                      onClick={handleJoinGame}
                      disabled={isJoining}
                      className="w-full"
                      size="lg"
                    >
                      {isJoining ? "Joining Game..." : "Join Game"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">Join as guest or</p>
                      <Link href="/signin" className="text-blue-600 hover:underline">
                        Sign in for better experience
                      </Link>
                    </div>

                    <form onSubmit={handleJoinAsGuest} className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        required
                        minLength={2}
                        maxLength={30}
                        disabled={isJoining}
                      />
                      <Button
                        type="submit"
                        disabled={isJoining || !guestName.trim()}
                        className="w-full"
                        size="lg"
                      >
                        {isJoining ? "Joining Game..." : "Join as Guest"}
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Start Game Button (Host Only) */}
            {isHost && gameParticipants?.allParticipants && gameParticipants.allParticipants.length > 0 && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleStartGame}
                  className="w-full"
                  size="lg"
                  variant="default"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Start Game
                </Button>
              </div>
            )}

            <div className="text-center">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground underline"
              >
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}