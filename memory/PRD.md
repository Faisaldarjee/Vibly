# Vibly - Product Requirements Document

## Original Problem Statement
User wanted to migrate their existing Vibly wellness app (originally built with Expo/React Native + FastAPI + MongoDB on Emergent) to a web-based React app with Supabase database, free AI options, and full project control with proper documentation.

## Architecture
- **Backend**: FastAPI (Python 3.11) + SQLAlchemy async + Supabase PostgreSQL
- **Frontend**: React 18 + Tailwind CSS + Recharts + Lucide Icons
- **AI**: Emergent Universal Key → OpenAI GPT-4o-mini (cheapest option)
- **Auth**: JWT-based with bcrypt password hashing
- **Database**: Supabase (PostgreSQL via Transaction Pooler)

## User Personas
1. **Health-conscious individual** - Tracks daily habits, water, sleep, mood
2. **Fitness enthusiast** - Uses goals and challenges to stay motivated
3. **Wellness seeker** - Relies on AI coach for personalized advice

## Core Requirements (Static)
- User authentication (register/login)
- Habit CRUD with streak tracking and templates
- Goal CRUD with progress tracking
- Vitals logging (water, sleep, mood, steps, weight)
- AI Coach chat with context awareness
- Community challenges with leaderboards
- Analytics with charts and vibe score
- Daily motivational quotes
- User profile management

## What's Been Implemented (March 26, 2026)
- [x] Complete FastAPI backend with 24+ API endpoints
- [x] Supabase PostgreSQL database integration (SQLAlchemy async)
- [x] React frontend with 8 page components
- [x] Dark theme "Performance Pro" design with Barlow Condensed + DM Sans fonts
- [x] AI Coach using GPT-4o-mini via Emergent Universal Key
- [x] Full navigation (8 tabs in bottom nav)
- [x] 5 seeded default challenges
- [x] Comprehensive README.md with setup instructions
- [x] Environment variable examples (.env.example files)
- [x] 100% backend test pass, 90%+ frontend test pass
- [x] **PWA Support** - Installable on mobile via "Add to Home Screen"
- [x] **Custom Logo** - AI-generated V energy wave logo
- [x] **Tagline** - "Track it. Feel it. Vibly."
- [x] **Service Worker** - Offline caching for static assets
- [x] **Splash Screen** - Loading animation with logo

## Prioritized Backlog

### P0 (Critical)
- None remaining - core app is functional

### P1 (Important)
- Push notifications for habit reminders
- Data export (CSV/JSON)
- Forgot password / email verification
- Dark/Light theme toggle

### P2 (Nice to Have)
- Social sharing with branded cards
- Weekly email summaries
- Habit analytics (best days, patterns)
- Multi-language support (Hindi, etc.)
- PWA support for mobile install
- Offline mode with sync

## Next Tasks
1. User can Save to GitHub via Emergent platform
2. Download ZIP for local development
3. Add PWA manifest for mobile install experience
4. Consider adding Google OAuth for easier login
5. Add data export feature for user control
