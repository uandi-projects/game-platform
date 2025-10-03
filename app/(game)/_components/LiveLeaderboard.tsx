"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, UserCircle, Target } from "lucide-react";

interface LiveLeaderboardProps {
  gameCode: string;
  currentUserProgress?: {
    questionsAnswered: number;
    totalQuestions: number;
    score?: number;
  };
}

export default function LiveLeaderboard({ gameCode, currentUserProgress }: LiveLeaderboardProps) {
  const gameProgress = useQuery(api.games.getGameProgress, { gameCode });
  const currentUser = useQuery(api.users.getCurrentUser);

  if (!gameProgress) {
    return null;
  }

  // Convert progress records to participant format
  const participantsWithProgress = gameProgress.map((progressRecord: any) => {
    const isCurrentUser =
      (progressRecord.participantType === 'authenticated' && progressRecord.participantId === currentUser?._id) ||
      (progressRecord.participantType === 'guest');

    return {
      id: progressRecord.participantId,
      name: progressRecord.participantName,
      type: progressRecord.participantType,
      isHost: false, // We'll determine this from the game instance if needed
      questionsAnswered: progressRecord.questionsAnswered,
      totalQuestions: progressRecord.totalQuestions,
      score: progressRecord.score,
      progress: (progressRecord.questionsAnswered / progressRecord.totalQuestions) * 100,
    };
  });

  // Sort by progress (questions answered) descending, then by score
  const sortedParticipants = participantsWithProgress.sort((a: any, b: any) => {
    if (b.questionsAnswered !== a.questionsAnswered) {
      return b.questionsAnswered - a.questionsAnswered;
    }
    return b.score - a.score;
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Live Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedParticipants.map((participant: any, index: number) => {
            const isCurrentUser =
              (participant.type === 'authenticated' && participant.id === currentUser?._id);

            // Calculate proper ranking position with ties
            let position = 1;

            // Count how many people have better performance than current participant
            for (let i = 0; i < index; i++) {
              if (
                sortedParticipants[i].questionsAnswered > participant.questionsAnswered ||
                (sortedParticipants[i].questionsAnswered === participant.questionsAnswered &&
                 sortedParticipants[i].score > participant.score)
              ) {
                position++;
              }
            }

            let positionIcon = null;
            let positionColor = "text-muted-foreground";

            if (position === 1) {
              positionIcon = <Trophy className="h-4 w-4 text-yellow-500" />;
              positionColor = "text-yellow-600 font-bold";
            } else {
              // Show position number for all non-#1 positions
              positionIcon = <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
              if (position === 2) {
                positionColor = "text-gray-500 font-semibold";
              } else if (position === 3) {
                positionColor = "text-amber-600 font-semibold";
              }
            }

            return (
              <div
                key={participant.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg transition-colors gap-3 bg-card ${
                  isCurrentUser
                    ? 'border-2 border-blue-500 dark:border-blue-400'
                    : 'border border-border'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                    position === 1 ? 'bg-yellow-100 dark:bg-yellow-900' :
                    position === 2 ? 'bg-gray-100 dark:bg-gray-800' :
                    position === 3 ? 'bg-amber-100 dark:bg-amber-900' :
                    'bg-muted'
                  }`}>
                    {positionIcon}
                  </div>

                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {participant.type === 'authenticated' ? (
                      <UserCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <UserCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-medium truncate block">
                        {participant.name}
                        {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                      </span>
                      {participant.isHost && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1 mt-1 w-fit">
                          <Crown className="h-3 w-3" />
                          Host
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-3 w-full sm:w-auto">
                  <div className="text-left sm:text-right flex-1 sm:flex-none">
                    <div className="flex items-center gap-1 text-sm">
                      <Target className="h-3 w-3" />
                      <span className="font-semibold">{participant.questionsAnswered}/{participant.totalQuestions}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(participant.progress)}% complete
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold">{participant.score} pts</div>
                  </div>
                </div>
              </div>
            );
          })}

          {sortedParticipants.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No participants found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}