# Vibly - Product Requirements Document

## Original Problem Statement
User wanted to migrate their existing Vibly wellness app (originally built with Expo/React Native + FastAPI + MongoDB on Emergent) to a web-based React app with Supabase database, free AI options, and full project control with proper documentation. Additionally wanted global app features: onboarding flow, social feed/community, push notifications, and Supabase Auth.

## Architecture
- **Backend**: FastAPI (Python 3.11) + SQLAlchemy async + Supabase PostgreSQL
- **Frontend**: React 18 + Tailwind CSS + Recharts + Lucide Icons
- **AI**: Emergent Universal Key → OpenAI GPT-4o-mini
- **Auth**: Supabase Auth with local JWT fallback
- **Database**: Supabase (PostgreSQL via Transaction Pooler)
- **PWA**: Service Worker + manifest.json for mobile install

## User Personas
1. Health-conscious individual - Tracks daily habits, water, sleep, mood
2. Fitness enthusiast - Uses goals and challenges to stay motivated
3. Wellness seeker - Relies on AI coach for personalized advice
4. Social user - Shares progress and motivates community

## Core Requirements (Static)
- User authentication (Supabase Auth + JWT)
- Onboarding flow (fitness level, goals, habit selection)
- Habit CRUD with streak tracking and templates
- Goal CRUD with progress tracking
- Vitals logging (water, sleep, mood, steps, weight)
- AI Coach chat with context awareness
- Social Feed (posts, vibe cards, likes)
- Community challenges with leaderboards
- Analytics with charts and vibe score
- Daily motivational quotes
- Push notifications for reminders
- PWA support for mobile install

## What's Been Implemented (March 26, 2026)
- [x] Complete FastAPI backend with 32+ API endpoints (100% test pass)
- [x] Supabase PostgreSQL database + Supabase Auth integration
- [x] React frontend with 10+ page components (95% test pass)
- [x] Dark theme design with Barlow Condensed + DM Sans fonts
- [x] AI Coach using GPT-4o-mini via Emergent Universal Key
- [x] **Onboarding Flow** - 3-step welcome (fitness level → goals → habits)
- [x] **Social Feed** - Community posts, vibe cards, likes, sharing
- [x] **Push Notifications** - Browser notification reminders
- [x] **PWA Support** - Installable on mobile
- [x] **Custom Logo** - AI-generated V energy wave
- [x] **Tagline** - "Track it. Feel it. Vibly."
- [x] Comprehensive README.md with setup instructions

## Prioritized Backlog

### P0 (Critical) - None remaining

### P1 (Important)
- Email verification flow
- Forgot password
- Data export (CSV/JSON)
- Dark/Light theme toggle

### P2 (Nice to Have)
- Weekly email summaries
- Habit analytics (best days, patterns)
- Multi-language support (Hindi, etc.)
- Offline mode with sync
- Social comments on posts
- User avatars/profile pictures
- Achievements/badges system

## Next Tasks
1. Deploy to production (Emergent Deploy or Railway+Vercel)
2. Push to GitHub via "Save to Github" feature
3. Add PWA builder for Play Store listing
4. User avatar upload support
5. Add achievements/badges gamification
