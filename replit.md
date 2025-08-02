# WorldCap - Country Capitals Learning Application

## Overview

WorldCap is a modern web application designed to help users learn world geography through interactive study modes. The application provides multiple ways to practice and memorize country-capital relationships, including quizzes, flashcards, typing practice, and map challenges. It features a comprehensive progress tracking system with achievements, streaks, and detailed statistics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL storage
- **Development**: Hot module replacement via Vite middleware

### Monorepo Structure
The application follows a monorepo pattern with shared TypeScript definitions:
- `/client` - React frontend application
- `/server` - Express.js backend API
- `/shared` - Shared TypeScript schemas and types

## Key Components

### Data Models
The application uses a well-structured database schema with the following main entities:
- **Users**: Store user profiles, streaks, and total study time
- **User Progress**: Track mastery levels and review needs per country
- **Quiz Sessions**: Record detailed session data for all study modes
- **Achievements**: Gamification system with various achievement types
- **Daily Stats**: Track daily learning activity and statistics

### Study Modes
Four distinct learning approaches are implemented:
1. **Quiz Mode**: Multiple choice questions with timed responses
2. **Flashcards**: Interactive flip cards for self-paced learning
3. **Typing Practice**: Accuracy-based text input challenges
4. **Map Challenge**: Visual geography learning with interactive maps

### Difficulty System
Three-tier difficulty system:
- **Beginner**: ~50 major countries and well-known capitals
- **Intermediate**: ~120 countries organized by continent
- **Expert**: All 195 countries worldwide

### Progress Tracking
Comprehensive analytics including:
- Enhanced mastery levels per country (0-100 scale with multi-factor calculation)
- Accuracy rates and total study time
- Streak tracking and daily statistics
- Spaced repetition system with time-based decay
- Minimum attempt requirements for true mastery (85+ level, 3+ attempts)

## Data Flow

### Client-Server Communication
- RESTful API endpoints for all data operations
- JSON request/response format with proper error handling
- React Query handles caching, background updates, and optimistic updates
- Express middleware provides request logging and error handling

### State Management Pattern
- Server state managed through React Query with automatic caching
- Local component state for UI interactions and form handling
- Shared types ensure type safety across client-server boundary
- Query invalidation triggers automatic UI updates

### Authentication Flow
Currently implements a demo user system (user ID 1) for development purposes. The architecture supports future authentication expansion through the existing user management system.

## External Dependencies

### UI and Styling
- **Radix UI**: Comprehensive component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Consistent icon system throughout the application
- **shadcn/ui**: Pre-built component library built on Radix UI

### Database and Backend
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database operations with migration support
- **Express Session Store**: PostgreSQL-backed session management

### Development Tools
- **Vite**: Fast development server with hot module replacement
- **TypeScript**: Static type checking across the entire codebase
- **ESBuild**: Fast bundling for production builds

## Deployment Strategy

### Build Process
- Frontend builds to `/dist/public` with Vite optimization
- Backend compiles to `/dist/index.js` with ESBuild bundling
- Shared schemas enable consistent types between client and server

### Environment Configuration
- Database URL configured via `DATABASE_URL` environment variable
- Development mode enables Vite middleware for hot reloading
- Production mode serves static files with Express

### Database Management
- Drizzle Kit provides schema migrations and database management
- PostgreSQL dialect with connection pooling for scalability
- Schema definitions in `/shared/schema.ts` ensure consistency

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 27, 2025. Initial setup
- July 18, 2025. Added comprehensive analytics dashboard system with clickable progress stats, detailed mastery tracking with blurred capitals for unmastered countries, streak calendar visualization, accuracy breakdown by difficulty and study mode, and Apple Screen Time-style study time analytics
- July 19, 2025. Enhanced mastery system with multi-factor calculation including accuracy, consistency bonuses, time decay, and minimum attempt requirements (85+ mastery level, 3+ attempts for true mastery)
- July 19, 2025. Implemented dynamic difficulty system with AI-powered personalized recommendations, replacing static difficulty levels with adaptive learning that analyzes user performance. Includes Smart Quiz feature with smooth, non-intrusive difficulty selection interface.
- July 19, 2025. Completed Smart Quiz functionality with working question generation, session management, and progress tracking. Increased question count to 20 for more comprehensive learning sessions.
- July 31, 2025. **CRITICAL FIX**: Resolved major authentication flaw where all users shared "demo-user-1" data. Implemented proper session-based user identification with individual progress tracking. Each user now has separate analytics, progress, achievements, and study statistics. Added comprehensive user registration/login system with secure password handling.
- July 31, 2025. **ANALYTICS ACCURACY ENSURED**: Fixed accuracy calculation bug and verified all user analytics track correctly. Individual users now have precise progress tracking with real-time accuracy calculations based on actual quiz performance. Multi-user testing confirms complete data isolation and accurate statistical computation.
- August 2, 2025. **SIMPLIFIED USER EXPERIENCE**: Removed separate analytics dashboard page to streamline navigation. All analytics now integrated into main dashboard as display-only cards. Users no longer navigate away from main dashboard, creating a more cohesive single-page experience.