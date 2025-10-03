import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getAuthenticatedUser } from "./authorization";
import fs from "fs";
import path from "path";

// Import game-specific question generators
import * as singlePlayerMath from "./gameTypes/single_player_math";
import * as multiPlayerMath from "./gameTypes/multi_player_math";
import * as customMathQuiz from "./gameTypes/custom_math_quiz";
import * as customMathRace from "./gameTypes/custom_math_race";

// Function to generate questions based on game type
function generateQuestionsForGame(gameId: string, customConfig?: any) {
  switch (gameId) {
    case "single-player-math":
      return singlePlayerMath.generateQuestions(customConfig);
    case "multi-player-math":
      return multiPlayerMath.generateQuestions(customConfig);
    case "custom-math-quiz":
      return customMathQuiz.generateQuestions(customConfig);
    case "custom-math-race":
      return customMathRace.generateQuestions(customConfig);
    default:
      return [];
  }
}

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

    // Generate questions for this game
    const questions = generateQuestionsForGame(gameId, customConfig);

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
        questions: questions,
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
      questions: questions,
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

// Get questions for a game instance
export const getGameQuestions = query({
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

    return gameInstance.questions;
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

    // Check if user has already completed or exited this game
    const userProgress = await ctx.db
      .query("gameProgress")
      .withIndex("by_participant", (q) => q.eq("gameCode", code).eq("participantId", user._id))
      .first();

    if (userProgress?.isCompleted) {
      throw new ConvexError("You have already completed or exited this game");
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

    // Check if guest has already completed or exited this game
    const guestParticipantId = `guest-${guestName}`;
    const guestProgress = await ctx.db
      .query("gameProgress")
      .withIndex("by_participant", (q) => q.eq("gameCode", code).eq("participantId", guestParticipantId))
      .first();

    if (guestProgress?.isCompleted) {
      throw new ConvexError("You have already completed or exited this game");
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
        isCompleted: true, // Mark as completed
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
        isCompleted: true, // Mark as completed
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

// Exit game - marks player as completed so they can't rejoin
export const exitGame = mutation({
  args: {
    gameCode: v.string(),
    guestName: v.optional(v.string()),
  },
  handler: async (ctx, { gameCode, guestName }) => {
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

    // Find or create progress record and mark as completed
    const existingProgress = await ctx.db
      .query("gameProgress")
      .withIndex("by_participant", (q) => q.eq("gameCode", gameCode).eq("participantId", participantId))
      .first();

    if (existingProgress) {
      // Mark as exited/completed
      await ctx.db.patch(existingProgress._id, {
        isActive: false,
        isCompleted: true,
        lastUpdated: Date.now(),
      });
    } else {
      // Create exit record
      await ctx.db.insert("gameProgress", {
        gameCode,
        participantId,
        participantName,
        participantType,
        questionsAnswered: 0,
        totalQuestions: 0,
        score: 0,
        isActive: false,
        isCompleted: true,
        lastUpdated: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get user's game history
export const getUserGameHistory = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Get all game progress for this user
    const gameProgress = await ctx.db
      .query("gameProgress")
      .filter((q) => q.eq(q.field("participantId"), user._id))
      .collect();

    // Get game instances for context
    const gameInstances = await Promise.all(
      gameProgress.map(async (progress) => {
        const instance = await ctx.db
          .query("gameInstances")
          .withIndex("by_code", (q) => q.eq("code", progress.gameCode))
          .first();
        return { progress, instance };
      })
    );

    // Sort by last updated (most recent first)
    return gameInstances
      .filter(({ instance }) => instance !== null)
      .sort((a, b) => b.progress.lastUpdated - a.progress.lastUpdated)
      .map(({ progress, instance }) => ({
        gameCode: progress.gameCode,
        gameId: instance?.gameId,
        score: progress.score,
        questionsAnswered: progress.questionsAnswered,
        totalQuestions: progress.totalQuestions,
        completedAt: progress.lastUpdated,
        isCompleted: !progress.isActive,
        gameType: instance?.type,
        createdAt: instance?.createdAt,
      }));
  },
});

// Get user's learning progress stats
export const getUserProgressStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Get all game progress for this user
    const gameProgress = await ctx.db
      .query("gameProgress")
      .filter((q) => q.eq(q.field("participantId"), user._id))
      .collect();

    const completed = gameProgress.filter(g => !g.isActive);
    const totalGames = completed.length;
    const totalScore = completed.reduce((sum, g) => sum + g.score, 0);
    const totalQuestions = completed.reduce((sum, g) => sum + g.questionsAnswered, 0);
    const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
    const accuracyRate = completed.length > 0 ?
      Math.round((completed.reduce((sum, g) => sum + (g.questionsAnswered > 0 ? g.score / g.questionsAnswered : 0), 0) / completed.length) * 100) : 0;

    // Calculate recent performance (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentGames = completed.filter(g => g.lastUpdated > sevenDaysAgo);

    // Get daily stats for chart
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = Date.now() - (i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      const dayGames = completed.filter(g => g.lastUpdated >= dayStart && g.lastUpdated < dayEnd);
      const dayScore = dayGames.reduce((sum, g) => sum + g.score, 0);

      dailyStats.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        games: dayGames.length,
        score: dayScore,
        averageScore: dayGames.length > 0 ? Math.round(dayScore / dayGames.length) : 0
      });
    }

    return {
      totalGames,
      averageScore,
      totalQuestions,
      accuracyRate,
      recentGames: recentGames.length,
      dailyStats,
      achievements: [
        totalGames >= 1 && { id: 'first_game', name: 'First Game', description: 'Completed your first game', earned: true },
        totalGames >= 5 && { id: 'regular_player', name: 'Regular Player', description: 'Completed 5 games', earned: true },
        totalGames >= 10 && { id: 'dedicated_learner', name: 'Dedicated Learner', description: 'Completed 10 games', earned: true },
        averageScore >= 80 && { id: 'high_scorer', name: 'High Scorer', description: 'Average score above 80%', earned: true },
        recentGames.length >= 3 && { id: 'active_learner', name: 'Active Learner', description: 'Played 3 games this week', earned: true },
      ].filter(Boolean)
    };
  },
});

// Get analytics data for teachers/admins
export const getAnalyticsData = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Only allow teachers and admins
    if (user.role !== 'teacher' && user.role !== 'admin') {
      throw new ConvexError('Access denied. Teachers and admins only.');
    }

    // Get all game instances and progress
    const allGameInstances = await ctx.db.query("gameInstances").collect();
    const allGameProgress = await ctx.db.query("gameProgress").collect();
    const allUsers = await ctx.db.query("users").collect();

    // Calculate key metrics
    const totalGames = allGameInstances.length;
    const totalPlayers = allUsers.filter(u => u.role === 'student').length;
    const completedGames = allGameProgress.filter(p => !p.isActive).length;
    const averageScore = completedGames > 0 ?
      Math.round(allGameProgress.filter(p => !p.isActive).reduce((sum, p) => sum + p.score, 0) / completedGames) : 0;

    // Game type distribution
    const gameTypeStats = allGameInstances.reduce((acc, game) => {
      acc[game.type] = (acc[game.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily activity for last 7 days
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = Date.now() - (i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      const dayGames = allGameInstances.filter(g => g.createdAt >= dayStart && g.createdAt < dayEnd);
      const dayProgress = allGameProgress.filter(p => p.lastUpdated >= dayStart && p.lastUpdated < dayEnd);

      dailyActivity.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        games: dayGames.length,
        activeUsers: new Set(dayProgress.filter(p => p.participantType === 'authenticated').map(p => p.participantId)).size,
        averageScore: dayProgress.length > 0 ? Math.round(dayProgress.reduce((sum, p) => sum + p.score, 0) / dayProgress.length) : 0
      });
    }

    // Top performing students
    const studentStats = allGameProgress
      .filter(p => p.participantType === 'authenticated' && !p.isActive)
      .reduce((acc, progress) => {
        if (!acc[progress.participantId]) {
          acc[progress.participantId] = {
            participantId: progress.participantId,
            participantName: progress.participantName,
            totalGames: 0,
            totalScore: 0,
            totalQuestions: 0
          };
        }
        acc[progress.participantId].totalGames++;
        acc[progress.participantId].totalScore += progress.score;
        acc[progress.participantId].totalQuestions += progress.questionsAnswered;
        return acc;
      }, {} as Record<string, any>);

    const topStudents = Object.values(studentStats)
      .map((student: any) => ({
        ...student,
        averageScore: student.totalGames > 0 ? Math.round(student.totalScore / student.totalGames) : 0,
        accuracy: student.totalQuestions > 0 ? Math.round((student.totalScore / student.totalQuestions) * 100) : 0
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    return {
      overview: {
        totalGames,
        totalPlayers,
        completedGames,
        averageScore
      },
      gameTypeStats,
      dailyActivity,
      topStudents
    };
  },
});

// Get current user's personal game progress (for leaderboards)
export const getCurrentUserProgress = query({
  args: {
    gameCode: v.string(),
  },
  handler: async (ctx, { gameCode }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const progress = await ctx.db
      .query("gameProgress")
      .filter((q) =>
        q.and(
          q.eq(q.field("gameCode"), gameCode),
          q.eq(q.field("participantId"), userId)
        )
      )
      .first();

    return progress;
  },
});