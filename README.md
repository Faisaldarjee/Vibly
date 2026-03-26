# Vibly - Track it. Feel it.

Your AI-Powered Wellness Command Center. Track habits, set goals, monitor vitals, get personalized AI coaching, and join a community of wellness seekers.

## Features

- **Onboarding** - Personalized 3-step setup (fitness level, goals, habit selection)
- **Dashboard** - Vibe Score, daily quotes, quick stats at a glance
- **Habit Tracker** - Create, toggle, and track daily habits with streak tracking
- **Goals** - Set and track progress on personal goals with visual progress bars
- **Vitals Logging** - Track water, sleep, mood, steps, and weight daily
- **AI Coach** - Powered by GPT-4o-mini, get personalized wellness advice
- **Community Feed** - Share updates, post vibe cards, like posts
- **Challenges** - Join community challenges or create your own with leaderboards
- **Analytics** - Visual charts for habit completion, goal progress, and vital trends
- **Push Notifications** - Reminders for water intake and habit check-ins
- **PWA Support** - Install on any phone via "Add to Home Screen"
- **Profile** - Manage your profile and view wellness stats

## Tech Stack

### Backend
- Python 3.11 + FastAPI
- Supabase PostgreSQL (via SQLAlchemy async)
- Supabase Auth (with JWT fallback)
- OpenAI GPT-4o-mini for AI Coach
- bcrypt for password hashing

### Frontend
- React 18 + Tailwind CSS
- Recharts for data visualization
- Lucide React for icons
- Progressive Web App (PWA)

### Database
- Supabase (PostgreSQL) - Free tier available

## Project Structure

```
Vibly/
├── backend/
│   ├── server.py            # Main FastAPI app (all API routes)
│   ├── database.py          # SQLAlchemy async engine config
│   ├── models.py            # ORM models (users, habits, goals, etc.)
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variables template
│   └── .env                 # Your environment variables (create this)
├── frontend/
│   ├── public/
│   │   ├── index.html       # HTML template with PWA setup
│   │   ├── manifest.json    # PWA manifest
│   │   ├── service-worker.js # Service worker for offline support
│   │   ├── logo192.png      # App icon (192px)
│   │   └── logo512.png      # App icon (512px)
│   ├── src/
│   │   ├── index.js         # React entry point
│   │   ├── index.css        # Global styles (Tailwind)
│   │   ├── App.js           # Main app with navigation
│   │   ├── api.js           # API client helper
│   │   └── components/
│   │       ├── AuthPage.js         # Login/Register
│   │       ├── OnboardingFlow.js   # 3-step onboarding
│   │       ├── Dashboard.js        # Home dashboard
│   │       ├── HabitsPage.js       # Habit tracking
│   │       ├── GoalsPage.js        # Goals management
│   │       ├── VitalsPage.js       # Vitals logging
│   │       ├── AICoachPage.js      # AI chat coach
│   │       ├── FeedPage.js         # Community feed
│   │       ├── ChallengesPage.js   # Community challenges
│   │       ├── AnalyticsPage.js    # Data analytics
│   │       └── ProfilePage.js      # User profile
│   ├── package.json         # Node.js dependencies
│   ├── tailwind.config.js   # Tailwind config
│   └── .env.example         # Frontend env template
├── render.yaml              # Render deployment config
├── vercel.json              # Vercel deployment config
├── Procfile                 # Process file for deployment
├── build.sh                 # Build script
└── README.md                # This file
```

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and Yarn
- A Supabase account (free tier: [supabase.com](https://supabase.com))

### Step 1: Clone the Repository
```bash
git clone https://github.com/Faisaldarjee/Vibly.git
cd Vibly
```

### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Linux/Mac
# OR: venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Edit .env with your credentials (see below)
```

### Step 3: Configure Environment Variables

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
AI_API_KEY=your-openai-api-key
JWT_SECRET=any-random-string-here
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

**Where to get these:**

| Variable | Where to get it |
|----------|----------------|
| DATABASE_URL | Supabase Dashboard → Connect → ORM → Transaction Pooler |
| AI_API_KEY | [OpenAI Platform](https://platform.openai.com/api-keys) (or any compatible provider) |
| JWT_SECRET | Any random string (e.g., generate with `openssl rand -hex 32`) |
| SUPABASE_URL | Supabase Dashboard → Settings → API → Project URL |
| SUPABASE_ANON_KEY | Supabase Dashboard → Settings → API → anon public key |
| SUPABASE_SERVICE_KEY | Supabase Dashboard → Settings → API → service_role key |

### Step 4: Run Backend
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
- Backend: `http://localhost:8001`
- API Docs: `http://localhost:8001/docs`

### Step 5: Frontend Setup
```bash
cd frontend

# Install dependencies
yarn install

# Create .env
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Start development server
yarn start
```
- Frontend: `http://localhost:3000`

---

## Deployment Guide

### Option 1: Render (Backend) + Vercel (Frontend) — FREE

#### Deploy Backend on Render

1. Go to [render.com](https://render.com) and sign up (free)
2. Click **"New" → "Web Service"**
3. Connect your GitHub repo (Faisaldarjee/Vibly)
4. Configure:
   - **Name**: `vibly-backend`
   - **Region**: Singapore (closest to India)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add **Environment Variables** (same as your .env):
   - `DATABASE_URL` = your Supabase connection string
   - `AI_API_KEY` = your API key
   - `JWT_SECRET` = your secret
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_ANON_KEY` = your anon key
   - `SUPABASE_SERVICE_KEY` = your service key
6. Click **"Create Web Service"**
7. Wait for deployment. Copy the URL (e.g., `https://vibly-backend.onrender.com`)

> **Note**: Render free tier sleeps after 15 min of inactivity. First request after sleep takes ~30 seconds.

#### Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Click **"Add New" → "Project"**
3. Import your GitHub repo (Faisaldarjee/Vibly)
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`
5. Add **Environment Variable**:
   - `REACT_APP_BACKEND_URL` = `https://vibly-backend.onrender.com` (your Render URL)
6. Click **"Deploy"**
7. Your app will be live at `https://vibly.vercel.app` (or custom domain)

#### After Deployment
- Open your Vercel URL on your phone
- Tap the browser menu → **"Add to Home Screen"**
- The app installs like a native app with the Vibly icon!

### Option 2: Custom VPS (DigitalOcean, AWS, etc.)
```bash
# Backend
cd backend
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001

# Frontend
cd frontend
yarn build
# Serve the 'build' folder with nginx
```

---

## API Documentation

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Onboarding
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/onboarding | Complete onboarding (fitness level, goals, habits) |

### Habits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/habits/templates | Get habit templates |
| GET | /api/habits | Get user's habits |
| POST | /api/habits | Create habit |
| POST | /api/habits/:id/toggle | Toggle habit completion |
| DELETE | /api/habits/:id | Delete habit |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/goals | Get user's goals |
| POST | /api/goals | Create goal |
| PUT | /api/goals/:id/progress | Update goal progress |
| DELETE | /api/goals/:id | Delete goal |

### Vitals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/vitals | Log a vital |
| GET | /api/vitals/today | Get today's vitals |
| GET | /api/vitals/week | Get week's vitals |

### AI Coach
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/coach | Send message to AI coach |
| GET | /api/ai/history/:session_id | Get chat history |

### Community Feed
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/feed | Get community feed |
| POST | /api/feed | Create a post |
| POST | /api/feed/:id/like | Toggle like on a post |
| POST | /api/feed/share-vibe | Share a vibe card |

### Challenges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/challenges | Get all challenges |
| POST | /api/challenges | Create challenge |
| POST | /api/challenges/:id/join | Join challenge |
| POST | /api/challenges/:id/checkin | Check in |
| GET | /api/challenges/:id/leaderboard | Get leaderboard |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/quote | Get daily quote |
| GET | /api/profile | Get profile |
| PUT | /api/profile | Update profile |
| GET | /api/share | Get share data |
| GET | /api/health | Health check |

---

## Database Schema

| Table | Description |
|-------|-------------|
| users | User accounts + onboarding data |
| habits | Daily habits with completion tracking |
| goals | Personal goals with progress |
| vitals | Daily vital logs (water, sleep, mood, steps, weight) |
| chat_messages | AI coach conversation history |
| challenges | Community challenges |
| challenge_participants | Challenge participation & check-ins |
| feed_posts | Community feed posts |
| feed_likes | Post likes |

---

## PWA (Progressive Web App)

After deploying, users can install Vibly on their phone:

**Android (Chrome):**
1. Open the app URL in Chrome
2. Tap the 3-dot menu (top right)
3. Tap "Add to Home Screen" or "Install App"
4. Done! App appears on home screen with Vibly icon

**iPhone (Safari):**
1. Open the app URL in Safari
2. Tap the Share button (bottom center)
3. Tap "Add to Home Screen"
4. Done!

**Features in PWA mode:**
- Full-screen app experience (no browser bar)
- Offline caching for static assets
- Push notification reminders
- Splash screen on launch
- Works on all modern phones (Android 5+, iOS 12+)

---

## License
MIT

## Author
Faisal - [@Faisaldarjee](https://github.com/Faisaldarjee)
