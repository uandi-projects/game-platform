import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import games from "../../../../games.json";
import GameRoomClient from "@/components/GameRoomClient";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const gameCode = resolvedParams.code.toUpperCase();

  try {
    const gameInstance = await fetchQuery(api.games.getGameInstanceByCode, { code: gameCode });

    if (!gameInstance) {
      return {
        title: "Game Not Found | U&I Game Platform",
        description: "The requested game room could not be found.",
      };
    }

    // Find the game type in games.json
    const gameType = games.games.find(game => game.id === gameInstance.gameId);
    const gameTitle = gameType?.ogTitle || gameType?.name || "Game";
    const gameDescription = gameType?.ogDescription || gameType?.description || "Join this game!";

    const title = `${gameTitle} - Room ${gameCode}`;
    const description = gameDescription;

    return {
      title: `${title} | U&I Game Platform`,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://uandi-game-platform.vercel.app'}/room/${gameCode}`,
        siteName: "U&I Game Platform",
        images: [
          {
            url: "/og-game.png",
            width: 1200,
            height: 630,
            alt: "U&I Game Platform",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/og-game.svg"],
      },
    };
  } catch (error) {
    console.error("Failed to fetch game metadata:", error);
    return {
      title: "Game Room | U&I Game Platform",
      description: "Join a game on U&I Game Platform!",
    };
  }
}

export default function GameRoomPage({ params }: { params: Promise<{ code: string }> }) {
  return <GameRoomClient params={params} />;
}