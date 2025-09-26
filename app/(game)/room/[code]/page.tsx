"use client";

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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

export default function GameRoom({ params }: { params: Promise<{ code: string }> }) {
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
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Check if current user has joined
  const currentUserHasJoined = gameParticipants?.allParticipants?.some(
    participant =>
      (participant?.type === 'authenticated' && participant?.id === currentUser?._id) ||
      (participant?.type === 'guest' && participant?.name === guestName && hasJoined)
  );

  const isHost = currentUser && gameInstance && currentUser._id === gameInstance.createdBy;

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

          // Bell-like frequency
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 1);

          // Bell-like envelope
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 1);
        };

        playBell();
      } catch (error) {
        console.error("Failed to play bell sound:", error);
      }

      // Redirect to game
      setTimeout(() => {
        router.push(`/game/${gameInstance.gameId}/${gameCode}`);
      }, 1200); // Small delay to let the bell play
    }
  }, [gameInstance?.status, gameInstance?.gameId, gameCode, router]);

  // Loading state
  if (gameInstance === undefined || gameParticipants === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Game not found
  if (!gameInstance || !gameParticipants) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Game Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            No game found with code <span className="font-mono font-bold">{gameCode}</span>
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Only allow multiplayer games in room
  if (gameInstance.type !== "multiplayer") {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Single Player Game</h1>
          <p className="mb-6 text-muted-foreground">
            This is a single player game. Redirecting you to the game...
          </p>
        </div>
      </div>
    );
  }

  const handleJoinAsAuthenticated = async () => {
    if (!currentUser) return;

    setIsJoining(true);
    try {
      await joinGame({ code: gameCode });
      setHasJoined(true);
    } catch (error) {
      console.error("Failed to join game:", error);
      alert("Failed to join game. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinAsGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setIsJoining(true);
    try {
      await joinGameAsGuest({ code: gameCode, guestName: guestName.trim() });
      setHasJoined(true);
    } catch (error) {
      console.error("Failed to join game as guest:", error);
      alert(error instanceof Error ? error.message : "Failed to join game. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartGame = async () => {
    try {
      await startMultiplayerGame({ code: gameCode });
      // The useEffect will handle the redirect when status changes to "active"
    } catch (error) {
      console.error("Failed to start game:", error);
      alert("Failed to start game. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">
              {gameInstance.customConfig ? 'Custom Math Race' : 'Math Race'}
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
                <span className="font-semibold">
                  {gameParticipants.allParticipants.length} Players Joined
                </span>
                {gameInstance.customConfig && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600 ml-2">
                    Custom
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {gameInstance.customConfig ? (
                  <>
                    <p>• {gameInstance.customConfig.questionCount} addition and subtraction questions</p>
                    <p>• {Math.floor(gameInstance.customConfig.timeLimit / 60)}m {gameInstance.customConfig.timeLimit % 60 > 0 ? `${gameInstance.customConfig.timeLimit % 60}s` : ''} to complete</p>
                    <p>• Race against other players!</p>
                    <p className="text-blue-600 font-medium">• Custom configuration applied</p>
                  </>
                ) : (
                  <>
                    <p>• 10 addition and subtraction questions</p>
                    <p>• 3 minutes to complete</p>
                    <p>• Race against other players!</p>
                  </>
                )}
              </div>
            </div>

            {/* Players List */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-center">Players in Room:</h3>
              <div className="space-y-2">
                {gameParticipants.allParticipants.length > 0 ? (
                  gameParticipants.allParticipants.map((participant) => (
                    <div
                      key={participant?.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-2">
                        {participant?.type === 'authenticated' ? (
                          <UserCircle className="h-5 w-5" />
                        ) : (
                          <UserCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{participant?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant?.isHost && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Host
                          </Badge>
                        )}
                        <Badge variant={participant?.type === 'authenticated' ? 'default' : 'secondary'}>
                          {participant?.type === 'authenticated' ? 'User' : 'Guest'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No players have joined yet
                  </div>
                )}
              </div>
            </div>

            {/* Join Section */}
            {!currentUserHasJoined && (
              <div className="border-t pt-6">
                {isAuthenticated && currentUser ? (
                  // Authenticated user join
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="mb-4">
                        Welcome, <span className="font-semibold">{currentUser.name || currentUser.email}</span>!
                      </p>
                      <Button
                        onClick={handleJoinAsAuthenticated}
                        disabled={isJoining}
                        className="px-8"
                        size="lg"
                      >
                        {isJoining ? (
                          <>
                            <Loader className="mr-2 h-4 w-4" />
                            Joining...
                          </>
                        ) : (
                          'Join Game'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Guest user join
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="text-muted-foreground mb-2">
                        Enter your name to join as a guest
                      </p>
                    </div>

                    <form onSubmit={handleJoinAsGuest} className="space-y-4">
                      <Input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Your display name"
                        className="text-center"
                        required
                        minLength={2}
                        maxLength={20}
                        disabled={isJoining}
                      />

                      <Button
                        type="submit"
                        disabled={isJoining || !guestName.trim()}
                        className="w-full"
                        size="lg"
                      >
                        {isJoining ? (
                          <>
                            <Loader className="mr-2 h-4 w-4" />
                            Joining...
                          </>
                        ) : (
                          'Join as Guest'
                        )}
                      </Button>
                    </form>

                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Have an account?
                      </p>
                      <Link
                        href="/signin"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Sign in here
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Game Controls */}
            {currentUserHasJoined && (
              <div className="border-t pt-6 text-center">
                {isHost ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      You are the host. Start the game when everyone is ready!
                    </p>
                    <Button
                      onClick={handleStartGame}
                      className="px-8"
                      size="lg"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Start Game
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Waiting for the host to start the game...
                  </p>
                )}
              </div>
            )}

            {/* Back Link */}
            <div className="text-center pt-4">
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