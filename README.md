# 🎮 Educational Game Platform

A comprehensive multiplayer educational gaming platform built with Next.js and Convex. Create, play, and track educational games with real-time multiplayer support, progress analytics, and role-based access control.

![Platform Preview](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![Convex](https://img.shields.io/badge/Convex-Database-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-cyan?logo=tailwindcss)

## 🌟 Key Features

### 🎯 Game Types
- **Single-Player Games**: Individual learning experiences with progress tracking
- **Multiplayer Games**: Real-time competitive games with live leaderboards
- **Custom Games**: Create personalized games with custom configurations
- **Math Games**: Built-in math quiz games with varying difficulty levels

### 👥 Role-Based Access Control
- **Students**: Play games, track progress, view achievements
- **Teachers**: Create games, invite students, view class analytics
- **Admins**: Full platform management, user administration, system analytics

### 📊 Analytics & Progress Tracking
- **Personal Progress**: Individual learning statistics and achievements
- **Game History**: Complete record of all games played
- **Teacher Analytics**: Student performance insights and engagement metrics
- **Real-time Leaderboards**: Live game progress and scoring

### 🔐 Security & Administration
- **Invite-Only System**: No public signup - users join via email invitations
- **Email Authentication**: Secure password-based authentication with reset functionality
- **Session Management**: Secure user sessions with JWT tokens
- **Admin Controls**: Comprehensive user and system management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Convex account ([convex.dev](https://convex.dev))
- A Resend account for email ([resend.com](https://resend.com))

### 1. Installation

```bash
git clone https://github.com/your-username/educational-game-platform
cd educational-game-platform
npm install
```

### 2. Convex Setup

```bash
# Initialize Convex development environment
npx convex dev
```

This will create your Convex deployment and generate environment variables.

### 3. Environment Configuration

Create `.env.local` with your configuration:

```bash
# Convex (auto-generated)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# App Configuration
NEXT_PUBLIC_APP_DOMAIN=http://localhost:3000
SITE_URL=http://localhost:3000

# JWT Configuration (generate new keys for production)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
JWKS={"keys":[{"use":"sig","kty":"RSA","n":"...","e":"AQAB"}]}

SETUP_SCRIPT_RAN=1
```

### 4. Create First Admin

```bash
npm run bootstrap-admin
```

### 5. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` to access the platform.

## 🎮 Game Development Guide

### Understanding Game Types

#### Single-Player Games
- **Purpose**: Individual learning experiences
- **Features**: Personal progress tracking, timed challenges, score history
- **Example**: Math Quiz Solo - students solve math problems at their own pace
- **Implementation**: Immediate game start, local progress tracking

#### Multiplayer Games
- **Purpose**: Competitive learning with peers
- **Features**: Real-time leaderboards, live progress updates, host controls
- **Example**: Math Race - students compete to solve problems fastest
- **Implementation**: Waiting room, host-managed start, live updates

#### Custom Games
- **Purpose**: Personalized learning experiences
- **Features**: Configurable settings, custom question sets, flexible rules
- **Example**: Custom Math Quiz with teacher-defined difficulty and topics
- **Implementation**: Configuration step before game creation

### 🔧 Adding a New Game

#### Step 1: Define Game Configuration

Add your game to the games configuration in `convex/games.ts`:

```typescript
{
  "id": "your-new-game",
  "name": "Your New Game",
  "type": "single-player", // or "multiplayer"
  "description": "Description of your educational game",
  "showTimer": true,
  "maxTime": 300,
  "isCustom": false // or true for configurable games
}
```

#### Step 2: Create Game Components

Create your game directory structure:

```
app/(game)/game/your-new-game/
├── [code]/
│   └── page.tsx          # Main game component
└── create/               # Only for custom games
    └── page.tsx          # Game configuration
```

#### Step 3: Implement Game Logic

**Single-Player Game Template:**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function YourNewGamePage({ params }: { params: { code: string } }) {
  const { code } = params;
  const gameInstance = useQuery(api.games.getGameInstanceByCode, { code });
  const updateProgress = useMutation(api.games.updateGameProgress);
  const completeGame = useMutation(api.games.completeGame);

  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Your game logic here...

  const handleAnswer = (answer: string) => {
    // Process answer, update score, progress to next question
    // Update live progress for multiplayer games
    if (gameInstance?.type === "multiplayer") {
      updateProgress({
        gameCode: code,
        questionsAnswered: currentQuestion + 1,
        totalQuestions: totalQuestions,
        score: newScore
      });
    }
  };

  const handleGameComplete = () => {
    completeGame({
      gameCode: code,
      finalScore: score,
      totalQuestions: totalQuestions,
      completedAt: Date.now()
    });
  };

  // Render your game UI...
}
```

**Multiplayer Game Additional Features:**

```typescript
// Add these for multiplayer games
const gameProgress = useQuery(api.games.getGameProgress, { gameCode: code });
const participants = useQuery(api.games.getGameParticipants, { code });
const startGame = useMutation(api.games.startMultiplayerGame);

// Include live leaderboard
import LiveLeaderboard from "../../_components/LiveLeaderboard";

// In your render:
<LiveLeaderboard gameCode={code} />
```

#### Step 4: Custom Game Configuration (Optional)

For configurable games, create a setup page:

```typescript
// app/(game)/game/your-new-game/create/page.tsx
export default function CreateYourNewGame() {
  const [config, setConfig] = useState({
    difficulty: "medium",
    topics: ["addition", "subtraction"],
    questionCount: 10
  });

  const handleCreate = () => {
    // Create game instance with custom config
    createGameInstance({
      gameId: "your-new-game",
      customConfig: config
    });
  };

  // Render configuration form...
}
```

#### Step 5: Game-Specific Convex Functions (If Needed)

Add specialized backend functions in `convex/games.ts`:

```typescript
// Example: Get custom questions based on game config
export const getCustomQuestions = query({
  args: { gameCode: v.string() },
  handler: async (ctx, { gameCode }) => {
    const instance = await ctx.db
      .query("gameInstances")
      .withIndex("by_code", (q) => q.eq("code", gameCode))
      .first();

    // Generate questions based on instance.customConfig
    return generateQuestions(instance?.customConfig);
  },
});
```

### 🎯 Game Development Best Practices

#### Performance
- **State Management**: Use React state for UI, Convex for persistence
- **Real-time Updates**: Debounce progress updates (every 2-3 seconds)
- **Loading States**: Always show loading indicators for async operations

#### User Experience
- **Mobile First**: Design for mobile devices primarily
- **Accessibility**: Include proper ARIA labels and keyboard navigation
- **Error Handling**: Graceful handling of network issues and edge cases
- **Progress Feedback**: Clear indicators of game progress and scoring

#### Data Management
- **Progress Tracking**: Update progress incrementally, not just at the end
- **Score Calculation**: Consistent scoring across similar game types
- **Time Management**: Handle timer edge cases and browser tab switching
- **Persistence**: Save game state to handle browser refreshes

### 🔧 Game Integration Checklist

When adding a new game, ensure you:

- [ ] Add game configuration to the games list
- [ ] Create game page component with proper routing
- [ ] Implement progress tracking with `updateGameProgress`
- [ ] Handle game completion with `completeGame`
- [ ] Add multiplayer support if applicable (leaderboard, live updates)
- [ ] Create custom configuration page for configurable games
- [ ] Test single-player and multiplayer modes
- [ ] Verify progress appears in analytics and history
- [ ] Test mobile responsiveness
- [ ] Add proper error handling and loading states

## 📱 Platform Architecture

### Frontend Structure
```
app/
├── (auth)/                 # Authentication pages
│   ├── signin/
│   ├── forgot-password/
│   └── reset-password/
├── (game)/                 # Game-related pages
│   ├── _components/        # Shared game components
│   │   ├── LiveLeaderboard.tsx
│   │   └── GameHeader.tsx
│   ├── game/              # Individual games
│   │   ├── single-player-math/
│   │   ├── multi-player-math/
│   │   └── custom-math-quiz/
│   └── room/              # Game waiting rooms
├── (management)/          # Platform management
│   ├── dashboard/         # Main dashboard
│   ├── progress/          # Personal progress tracking
│   ├── history/           # Game history
│   ├── analytics/         # Teacher/admin analytics
│   ├── admin/             # Admin panel
│   ├── invite/            # User invitations
│   └── profile/           # User profiles
└── api/                   # API routes
    └── health/            # Health check for Docker
```

### Backend Structure (Convex)
```
convex/
├── schema.ts              # Database schema
├── auth.ts                # Authentication setup
├── authorization.ts       # Role-based access control
├── users.ts               # User management
├── invites.ts             # Email invitations
├── games.ts               # Game logic and data
└── _generated/            # Auto-generated files
```

### Database Schema

#### Core Tables
- **users**: User profiles with role-based access control
- **gameInstances**: Game sessions and configurations
- **gameProgress**: Real-time game progress and scores
- **inviteTokens**: Email invitation management
- **passwordResetTokens**: Secure password reset system

## 📊 Analytics & Reporting

### Student Analytics
- **Personal Progress**: Games played, average scores, improvement trends
- **Achievement System**: Unlockable badges for milestones
- **Learning Insights**: Strengths, weaknesses, and recommendations
- **Time Tracking**: Study time and engagement patterns

### Teacher Analytics
- **Class Overview**: Student engagement and performance metrics
- **Game Analytics**: Most popular games and difficulty analysis
- **Progress Tracking**: Individual and class-wide improvement
- **Activity Reports**: Daily, weekly, and monthly engagement data

### Admin Analytics
- **Platform Usage**: User activity and growth metrics
- **Content Analytics**: Game popularity and effectiveness
- **System Health**: Performance monitoring and error tracking
- **User Management**: Registration trends and role distribution

## 🔒 Security Features

### Authentication & Authorization
- **Email-Only Registration**: Invite-based user onboarding
- **JWT Token Security**: Secure session management
- **Role-Based Permissions**: Hierarchical access control
- **Password Security**: Bcrypt hashing with secure reset flow

### Data Protection
- **Input Validation**: Comprehensive server-side validation
- **SQL Injection Prevention**: Convex's built-in protection
- **XSS Protection**: React's built-in sanitization
- **CSRF Protection**: Token-based request verification

### Privacy Compliance
- **Data Minimization**: Only collect necessary user data
- **Secure Storage**: Encrypted data storage in Convex
- **Audit Logging**: Track admin actions and user activities
- **Data Export**: User data portability features

## 🚀 Deployment

### Docker Deployment

The platform includes Docker support for easy deployment:

```bash
# Build Docker image
docker build -t educational-game-platform .

# Run with environment variables
docker run -p 3000:3000 --env-file .env educational-game-platform
```

### Dockploy Deployment

1. **Repository Setup**: Push code to GitHub/GitLab
2. **Environment Configuration**: Set all required environment variables
3. **Domain Configuration**: Point your domain to Dockploy
4. **Deploy**: Use Dockploy's one-click deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Production Environment Variables

```bash
# Production Convex
CONVEX_DEPLOYMENT=prod:your-production-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-prod-deployment.convex.cloud

# Production Email
RESEND_API_KEY=re_production_api_key
FROM_EMAIL=noreply@yourdomain.com

# Production Domain
NEXT_PUBLIC_APP_DOMAIN=https://yourdomain.com
SITE_URL=https://yourdomain.com

# Production JWT Keys (Generate new ones!)
JWT_PRIVATE_KEY="production_private_key"
JWKS={"keys":[...]}
```

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/your-username/educational-game-platform`
3. **Install dependencies**: `npm install`
4. **Set up Convex**: `npx convex dev`
5. **Configure environment**: Copy `.env.example` to `.env.local`
6. **Start development**: `npm run dev`

### Game Contribution Guidelines

When contributing new games:

1. **Follow naming conventions**: Use kebab-case for game IDs
2. **Implement both modes**: Single-player and multiplayer when applicable
3. **Add comprehensive tests**: Test game logic and edge cases
4. **Document game rules**: Clear instructions for players
5. **Ensure accessibility**: Support keyboard navigation and screen readers
6. **Mobile optimization**: Test on various screen sizes

### Code Standards

- **TypeScript**: All code must be typed
- **ESLint**: Follow the configured linting rules
- **Prettier**: Use consistent code formatting
- **Comments**: Document complex game logic
- **Testing**: Add tests for new functionality

### Pull Request Process

1. **Create feature branch**: `git checkout -b feature/new-game-type`
2. **Implement changes**: Follow game development guide
3. **Test thoroughly**: Both single-player and multiplayer modes
4. **Update documentation**: Add game to README and guides
5. **Submit PR**: Include description, screenshots, and testing notes

## 📚 API Reference

### Game Management

```typescript
// Create new game instance
await createGameInstance({
  gameId: "game-type",
  customConfig?: any
});

// Join multiplayer game
await joinGame({ code: "ABC123" });

// Update game progress
await updateGameProgress({
  gameCode: "ABC123",
  questionsAnswered: 5,
  totalQuestions: 10,
  score: 80
});

// Complete game
await completeGame({
  gameCode: "ABC123",
  finalScore: 85,
  totalQuestions: 10,
  completedAt: Date.now()
});
```

### Analytics Queries

```typescript
// Get user progress stats
const stats = await getUserProgressStats();

// Get user game history
const history = await getUserGameHistory();

// Get analytics data (teachers/admins only)
const analytics = await getAnalyticsData();
```

### User Management

```typescript
// Get current user
const user = await getCurrentUser();

// Send user invite (admin only)
await sendInvite({
  email: "user@example.com",
  role: "student"
});
```

## 🏆 Achievements System

The platform includes a comprehensive achievements system:

### Student Achievements
- **First Game**: Complete your first game
- **Regular Player**: Complete 5 games
- **Dedicated Learner**: Complete 10 games
- **High Scorer**: Maintain 80%+ average score
- **Active Learner**: Play 3+ games per week

### Game-Specific Achievements
- **Perfect Score**: Score 100% on any game
- **Speed Runner**: Complete game under time limit
- **Consistency King**: 5 games in a row above 90%
- **Multiplayer Champion**: Win 10 multiplayer games

### Custom Achievements
Teachers can create custom achievements based on:
- Specific game completion
- Subject mastery
- Participation goals
- Time-based challenges

## 🔧 Advanced Configuration

### Custom Game Templates

Create reusable game templates:

```typescript
// Define template in convex/gameTemplates.ts
export const mathQuizTemplate = {
  defaultConfig: {
    questionCount: 10,
    timeLimit: 300,
    difficulty: "medium"
  },
  configSchema: {
    questionCount: { min: 5, max: 50 },
    timeLimit: { min: 60, max: 1800 },
    difficulty: ["easy", "medium", "hard"]
  }
};
```

### Custom Scoring Systems

Implement custom scoring logic:

```typescript
// Example: Time-based scoring
const calculateScore = (correctAnswers: number, totalQuestions: number, timeSpent: number) => {
  const accuracy = correctAnswers / totalQuestions;
  const timeBonus = Math.max(0, (300 - timeSpent) / 300); // 5-minute game
  return Math.round((accuracy * 70) + (timeBonus * 30)); // 70% accuracy, 30% speed
};
```

### Integration with Learning Management Systems

Connect with external LMS platforms:

```typescript
// Example: Canvas integration
export const syncToCanvas = async (userId: string, gameResults: GameResult[]) => {
  // Sync game scores to Canvas gradebook
  // Implementation depends on LMS API
};
```

## 📞 Support & Community

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs on [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: Join discussions in [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: Contact maintainers at support@yourdomain.com

### Community Resources

- **Discord Server**: Join our developer community
- **Weekly Office Hours**: Live Q&A sessions for developers
- **Game Development Workshops**: Learn to create educational games
- **Teacher Training**: Workshops for educators using the platform

### Contributing Back

We encourage contributions:
- **New Games**: Share your educational game creations
- **Bug Fixes**: Help improve platform stability
- **Documentation**: Improve guides and examples
- **Translations**: Help make the platform multilingual

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- **[Convex](https://convex.dev)** - Real-time backend platform
- **[Next.js](https://nextjs.org)** - React framework
- **[Tailwind CSS](https://tailwindcss.com)** - CSS framework
- **[Shadcn/ui](https://ui.shadcn.com)** - UI components
- **[Recharts](https://recharts.org)** - Charting library
- **[Resend](https://resend.com)** - Email delivery
- **[Lucide React](https://lucide.dev)** - Icon library

---

**Happy Learning! 🎓✨**

Transform education through interactive, engaging games that make learning fun and trackable.