import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getAuthenticatedUser } from "./authorization";
import fs from "fs";
import path from "path";

// Get available games from games.json
export const getAvailableGames = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Load games from JSON file
    // Note: In production, you might want to store this in the database
    // or use a different approach for dynamic loading
    const gamesData = {
      "games": [
        {
          "id": "single-player-math",
          "name": "Math Quiz Solo",
          "type": "single-player",
          "description": "Test your math skills with addition and subtraction",
          "showTimer": true,
          "maxTime": 300
        },
        {
          "id": "multi-player-math",
          "name": "Math Race",
          "type": "multiplayer",
          "description": "Race against others to solve math problems",
          "showTimer": true,
          "maxTime": 180
        },
        {
          "id": "custom-math-quiz",
          "name": "Custom Math Quiz",
          "type": "single-player",
          "description": "Create your own math quiz with custom settings",
          "showTimer": true,
          "maxTime": 300,
          "isCustom": true
        },
        {
          "id": "custom-math-race",
          "name": "Custom Math Race",
          "type": "multiplayer",
          "description": "Create a custom math race with your own settings",
          "showTimer": true,
          "maxTime": 180,
          "isCustom": true
        }
      ]
    };

    // Filter games based on user role
    let availableGames = gamesData.games;

    // Students only see single-player games
    if (user.role === "student") {
      availableGames = gamesData.games.filter(game => game.type === "single-player");
    }

    return availableGames;
  },
});

// Create a new game instance
export const createGameInstance = mutation({
  args: {
    gameId: v.string(),
    customConfig: v.optional(v.any()), // Custom configuration for custom games
  },
  handler: async (ctx, { gameId, customConfig }) => {
    const user = await getAuthenticatedUser(ctx);

    // Load game data to get type
    const gamesData = {
      "games": [
        {
          "id": "single-player-math",
          "name": "Math Quiz Solo",
          "type": "single-player",
          "description": "Test your math skills with addition and subtraction",
          "showTimer": true,
          "maxTime": 300
        },
        {
          "id": "multi-player-math",
          "name": "Math Race",
          "type": "multiplayer",
          "description": "Race against others to solve math problems",
          "showTimer": true,
          "maxTime": 180
        },
        {
          "id": "custom-math-quiz",
          "name": "Custom Math Quiz",
          "type": "single-player",
          "description": "Create your own math quiz with custom settings",
          "showTimer": true,
          "maxTime": 300,
          "isCustom": true
        },
        {
          "id": "custom-math-race",
          "name": "Custom Math Race",
          "type": "multiplayer",
          "description": "Create a custom math race with your own settings",
          "showTimer": true,
          "maxTime": 180,
          "isCustom": true
        }
      ]
    };

    const game = gamesData.games.find(g => g.id === gameId);
    if (!game) {
      throw new ConvexError("Game not found");
    }

    // Generate a unique game code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Check if code already exists (unlikely but possible)
    const existingInstance = await ctx.db
      .query("gameInstances")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (existingInstance) {
      // Try again with a different code
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const instanceId = await ctx.db.insert("gameInstances", {
        code: newCode,
        gameId: gameId,
        type: game.type as "single-player" | "multiplayer",
        createdBy: user._id,
        participants: game.type === "single-player" ? [user._id] : [],
        creatorParticipating: game.type === "multiplayer" ? true : undefined,
        createdAt: Date.now(),
        status: "waiting",
        customConfig: customConfig || undefined,
      });

      return {
        instanceId,
        code: newCode,
        gameId,
        type: game.type,
      };
    }

    const instanceId = await ctx.db.insert("gameInstances", {
      code: code,
      gameId: gameId,
      type: game.type as "single-player" | "multiplayer",
      createdBy: user._id,
      participants: game.type === "single-player" ? [user._id] : [],
      creatorParticipating: game.type === "multiplayer" ? true : undefined,
      createdAt: Date.now(),
      status: "waiting",
      customConfig: customConfig || undefined,
    });

    return {
      instanceId,
      code,
      gameId,
      type: game.type,
    };
  },
});

// Get game instance by code
export const getGameInstanceByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const gameInstance = await ctx.db
      .query("gameInstances")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!gameInstance) {
      return null;
    }

    // Get creator information
    const creator = await ctx.db.get(gameInstance.createdBy);

    return {
      ...gameInstance,
      creator: creator ? {
        id: creator._id,
        name: creator.name || creator.email,
      } : null,
    };
  },
});

// Join a multiplayer game (authenticated users)
export const joinGame = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const user = await getAuthenticatedUser(ctx);

    const gameInstance = await ctx.db
      .query("gameInstances")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!gameInstance) {
      throw new ConvexError("Game not found");
    }

    if (gameInstance.type === "single-player") {
      throw new ConvexError("Cannot join single-player games");
    }

    if (gameInstance.status === "completed") {
      throw new ConvexError("Game has already completed");
    }

    // Check if user is already a participant
    if (gameInstance.participants.includes(user._id)) {
      return gameInstance;
    }

    // Add user to participants
    await ctx.db.patch(gameInstance._id, {
      participants: [...gameInstance.participants, user._id],
    });

    return await ctx.db.get(gameInstance._id);
  },
});

// Join a multiplayer game (unauthenticated users with name)
export const joinGameAsGuest = mutation({
  args: {
    code: v.string(),
    guestName: v.string(),
  },
  handler: async (ctx, { code, guestName }) => {
    const gameInstance = await ctx.db
      .query("gameInstances")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!gameInstance) {
      throw new ConvexError("Game not found");
    }

    if (gameInstance.type === "single-player") {
      throw new ConvexError("Cannot join single-player games");
    }

    if (gameInstance.status === "completed") {
      throw new ConvexError("Game has already completed");
    }

    // For now, we'll store guest names in a separate field
    // In a real implementation, you might want to create temporary user records
    const currentGuests = gameInstance.guestParticipants || [];

    // Check if guest name already exists
    if (currentGuests.some(guest => guest.name === guestName)) {
      throw new ConvexError("A player with this name has already joined");
    }

    const newGuest = {
      name: guestName,
      joinedAt: Date.now(),
    };

    await ctx.db.patch(gameInstance._id, {
      guestParticipants: [...currentGuests, newGuest],
    });

    return await ctx.db.get(gameInstance._id);
  },
});

// Get all participants (both authenticated and guest users)
export const getGameParticipants = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const gameInstance = await ctx.db
      .query("gameInstances")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!gameInstance) {
      return null;
    }

    // Get authenticated participants
    const authenticatedParticipants = await Promise.all(
      gameInstance.participants.map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user ? {
          id: user._id,
          name: user.name || user.email,
          type: 'authenticated' as const,
          isHost: userId === gameInstance.createdBy,
        } : null;
      })
    );

    // Get guest participants
    const guestParticipants = (gameInstance.guestParticipants || []).map((guest, index) => ({
      id: `guest-${index}`,
      name: guest.name,
      type: 'guest' as const,
      isHost: false,
    }));

    return {
      ...gameInstance,
      allParticipants: [
        ...authenticatedParticipants.filter(Boolean),
        ...guestParticipants,
      ],
    };
  },
});

// Start a multiplayer game (host only)
export const startMultiplayerGame = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const user = await getAuthenticatedUser(ctx);

    const gameInstance = await ctx.db
      .query("gameInstances")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!gameInstance) {
      throw new ConvexError("Game not found");
    }

    if (gameInstance.createdBy !== user._id) {
      throw new ConvexError("Only the host can start the game");
    }

    if (gameInstance.type !== "multiplayer") {
      throw new ConvexError("This is not a multiplayer game");
    }

    // Update game status to active and record start time
    await ctx.db.patch(gameInstance._id, {
      status: "active",
      gameStartedAt: Date.now(),
    });

    return await ctx.db.get(gameInstance._id);
  },
});

// Start a single-player game
export const startSinglePlayerGame = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required");
    }

    const gameInstance = await ctx.db
      .query("gameInstances")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!gameInstance) {
      throw new ConvexError("Game not found");
    }

    if (gameInstance.type !== "single-player") {
      throw new ConvexError("This is not a single-player game");
    }

    // Only set start time if not already started
    if (!gameInstance.gameStartedAt) {
      await ctx.db.patch(gameInstance._id, {
        status: "active",
        gameStartedAt: Date.now(),
      });
    }

    return await ctx.db.get(gameInstance._id);
  },
});

// Update game progress for a participant
export const updateGameProgress = mutation({
  args: {
    gameCode: v.string(),
    questionsAnswered: v.number(),
    totalQuestions: v.number(),
    score: v.number(),
    guestName: v.optional(v.string()), // For guest users
  },
  handler: async (ctx, { gameCode, questionsAnswered, totalQuestions, score, guestName }) => {
    const userId = await getAuthUserId(ctx);

    let participantId: string;
    let participantName: string;
    let participantType: "authenticated" | "guest";

    if (userId && !guestName) {
      // Authenticated user
      const user = await ctx.db.get(userId);
      if (!user) throw new ConvexError("User not found");

      participantId = userId;
      participantName = user.name || user.email || "Unknown User";
      participantType = "authenticated";
    } else if (guestName) {
      // Guest user
      participantId = `guest-${guestName}`;
      participantName = guestName;
      participantType = "guest";
    } else {
      throw new ConvexError("Must be authenticated or provide guest name");
    }

    // Check if progress record exists
    const existingProgress = await ctx.db
      .query("gameProgress")
      .withIndex("by_participant", (q) => q.eq("gameCode", gameCode).eq("participantId", participantId))
      .first();

    if (existingProgress) {
      // Update existing progress
      await ctx.db.patch(existingProgress._id, {
        questionsAnswered,
        totalQuestions,
        score,
        isActive: true,
        lastUpdated: Date.now(),
      });
    } else {
      // Create new progress record
      await ctx.db.insert("gameProgress", {
        gameCode,
        participantId,
        participantName,
        participantType,
        questionsAnswered,
        totalQuestions,
        score,
        isActive: true,
        lastUpdated: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get live game progress for all participants
export const getGameProgress = query({
  args: {
    gameCode: v.string(),
  },
  handler: async (ctx, { gameCode }) => {
    const progressRecords = await ctx.db
      .query("gameProgress")
      .withIndex("by_game_code", (q) => q.eq("gameCode", gameCode))
      .collect();

    // Sort by progress (questions answered) descending, then by score
    return progressRecords
      .filter(record => record.isActive)
      .sort((a, b) => {
        if (b.questionsAnswered !== a.questionsAnswered) {
          return b.questionsAnswered - a.questionsAnswered;
        }
        return b.score - a.score;
      });
  },
});

// Mark a game as completed
export const completeGame = mutation({
  args: {
    gameCode: v.string(),
    finalScore: v.number(),
    totalQuestions: v.number(),
    completedAt: v.number(),
    guestName: v.optional(v.string()),
  },
  handler: async (ctx, { gameCode, finalScore, totalQuestions, completedAt, guestName }) => {
    const userId = await getAuthUserId(ctx);

    // Find the game instance
    const gameInstance = await ctx.db
      .query("gameInstances")
      .withIndex("by_code", (q) => q.eq("code", gameCode))
      .first();

    if (!gameInstance) {
      throw new ConvexError("Game not found");
    }

    let participantId: string;
    let participantName: string;
    let participantType: "authenticated" | "guest";

    if (userId && !guestName) {
      // Authenticated user
      const user = await ctx.db.get(userId);
      if (!user) throw new ConvexError("User not found");

      participantId = userId;
      participantName = user.name || user.email || "Unknown User";
      participantType = "authenticated";
    } else if (guestName) {
      // Guest user
      participantId = `guest-${guestName}`;
      participantName = guestName;
      participantType = "guest";
    } else {
      throw new ConvexError("Must be authenticated or provide guest name");
    }

    // Update or create final progress record
    const existingProgress = await ctx.db
      .query("gameProgress")
      .withIndex("by_participant", (q) => q.eq("gameCode", gameCode).eq("participantId", participantId))
      .first();

    if (existingProgress) {
      // Mark as completed
      await ctx.db.patch(existingProgress._id, {
        questionsAnswered: totalQuestions,
        totalQuestions,
        score: finalScore,
        isActive: false, // Mark as inactive since game is complete
        lastUpdated: completedAt,
      });
    } else {
      // Create completion record
      await ctx.db.insert("gameProgress", {
        gameCode,
        participantId,
        participantName,
        participantType,
        questionsAnswered: totalQuestions,
        totalQuestions,
        score: finalScore,
        isActive: false, // Game is complete
        lastUpdated: completedAt,
      });
    }

    // For single-player games, mark the game instance as completed
    if (gameInstance.type === "single-player") {
      await ctx.db.patch(gameInstance._id, {
        status: "completed",
      });
    }

    // For multiplayer games, check if all participants have finished
    // (This is a simplified approach - in a more complex system, you might want different logic)
    if (gameInstance.type === "multiplayer") {
      const allProgress = await ctx.db
        .query("gameProgress")
        .withIndex("by_game_code", (q) => q.eq("gameCode", gameCode))
        .collect();

      const totalParticipants = gameInstance.participants.length + (gameInstance.guestParticipants?.length || 0);
      const completedParticipants = allProgress.filter(p => !p.isActive).length;

      // If all participants have completed, mark game as completed
      if (completedParticipants >= totalParticipants) {
        await ctx.db.patch(gameInstance._id, {
          status: "completed",
        });
      }
    }

    return { success: true };
  },
});