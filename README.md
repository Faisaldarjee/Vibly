# Vibly - AI-Powered Wellness Command Center

Vibly is a comprehensive wellness application that helps you track habits, set goals, monitor vitals, and get personalized AI coaching advice. Built with modern technologies for optimal performance.

## Features

- **Dashboard** - Your wellness command center with Vibe Score, daily quotes, quick stats
- **Habit Tracker** - Create, toggle, and track daily habits with streak tracking
- **Goals** - Set and track progress on personal goals with visual progress bars
- **Vitals Logging** - Track water intake, sleep, mood, steps, and weight daily
- **AI Coach** - Powered by GPT-4o-mini, get personalized wellness advice
- **Challenges** - Join community challenges or create your own with leaderboards
- **Analytics** - Visual charts showing your habit completion, goals progress, and vitals trends
- **Profile** - Manage your profile and view your wellness stats

## Tech Stack

### Backend
- **Python 3.11** + **FastAPI**
- **Supabase PostgreSQL** (via SQLAlchemy async)
- **Emergent Universal Key** for AI (OpenAI GPT-4o-mini)
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **React 18** + **Tailwind CSS**
- **Recharts** for data visualization
- **Lucide React** for icons
- **Framer Motion** for animations

### Database
- **Supabase** (PostgreSQL) - hosted at supabase.co

## Project Structure

```
vibly/
├── backend/
│   ├── server.py          # Main FastAPI app with all API routes
│   ├── database.py        # SQLAlchemy async engine & session config
│   ├── models.py          # SQLAlchemy ORM models
│   ├── requirements.txt   # Python dependencies
│   ├── .env               # Environment variables (create from .env.example)
│   └── alembic/           # Database migrations (optional)
├── frontend/
│   ├── public/
│   │   └── index.html     # HTML template
│   ├── src/
│   │   ├── index.js       # React entry point
│   │   ├── index.css      # Global styles (Tailwind)
│   │   ├── App.js         # Main app with navigation
│   │   ├── api.js         # API client helper
│   │   └── components/
│   │       ├── AuthPage.js       # Login/Register
│   │       ├── Dashboard.js      # Home dashboard
│   │       ├── HabitsPage.js     # Habit tracking
│   │       ├── GoalsPage.js      # Goals management
│   │       ├── VitalsPage.js     # Vitals logging
│   │       ├── AICoachPage.js    # AI chat coach
│   │       ├── ChallengesPage.js # Community challenges
│   │       ├── AnalyticsPage.js  # Data analytics
│   │       └── ProfilePage.js    # User profile
│   ├── package.json       # Node.js dependencies
│   ├── tailwind.config.js # Tailwind CSS config
│   └── .env               # Frontend environment variables
└── README.md
```

## Setup Instructions (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+ and Yarn
- A Supabase account (free tier works)

### 1. Clone the Repository
```bash
git clone https://github.com/Faisaldarjee/Vibly.git
cd Vibly
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from example below)
cp .env.example .env
# Edit .env with your credentials
```

### 3. Backend Environment Variables (.env)
Create `backend/.env` with:
```env
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
EMERGENT_LLM_KEY=your-emergent-key-here
JWT_SECRET=your-random-secret-key-here
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

**How to get Supabase credentials:**
1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to Settings > API to find your keys
3. Go to Connect > ORM > Transaction Pooler for the DATABASE_URL

**How to get Emergent LLM Key:**
- Sign up at [emergentagent.com](https://emergentagent.com)
- Go to Profile > Universal Key
- Top up balance (very affordable)

### 4. Run Backend
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
Backend will be at: `http://localhost:8001`
API docs: `http://localhost:8001/docs`

### 5. Frontend Setup
```bash
cd frontend

# Install dependencies
yarn install

# Create .env file
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Start development server
yarn start
```
Frontend will be at: `http://localhost:3000`

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

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
| GET | /api/ai/sessions | Get all chat sessions |

### Challenges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/challenges | Get all challenges |
| POST | /api/challenges | Create challenge |
| POST | /api/challenges/:id/join | Join challenge |
| POST | /api/challenges/:id/checkin | Check in to challenge |
| GET | /api/challenges/:id/leaderboard | Get leaderboard |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/vibe-score | Get vibe score |
| GET | /api/analytics/summary | Get analytics summary |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/quote | Get daily quote |
| GET | /api/profile | Get profile |
| PUT | /api/profile | Update profile |
| GET | /api/share | Get share data |
| GET | /api/health | Health check |

## Database Schema

### Tables
- **users** - User accounts (id, name, email, password_hash, avatar_url, bio)
- **habits** - User habits (id, user_id, name, icon, color, frequency, completed_dates)
- **goals** - User goals (id, user_id, title, description, target_value, current_value, unit)
- **vitals** - Daily vital logs (id, user_id, vital_type, value, date)
- **chat_messages** - AI chat history (id, user_id, session_id, role, content)
- **challenges** - Community challenges (id, title, description, type, duration_days)
- **challenge_participants** - Challenge participation (id, challenge_id, user_id, checkin_dates)

## Deployment

### Deploy on any VPS (DigitalOcean, AWS, Railway, etc.)
1. Set up PostgreSQL (or use Supabase)
2. Deploy backend with gunicorn/uvicorn
3. Build frontend: `cd frontend && yarn build`
4. Serve with nginx or any static host

### Deploy on Vercel (Frontend only)
```bash
cd frontend
vercel deploy
```

### Deploy on Railway
Push to GitHub and connect Railway for automatic deploys.

## License
MIT

## Author
Faisal - [@Faisaldarjee](https://github.com/Faisaldarjee)
