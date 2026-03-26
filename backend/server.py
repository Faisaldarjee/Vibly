import os
import uuid
import random
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy import select, delete, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client

from database import get_db, engine, Base, AsyncSessionLocal
from models import (User, Habit, Goal, Vital, ChatMessage, Challenge,
                    ChallengeParticipant, FeedPost, FeedLike)
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv(Path(__file__).parent / '.env')

JWT_SECRET = os.environ.get('JWT_SECRET', 'vibly-fallback-secret')
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')

# Initialize Supabase client for auth
supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vibly API", version="2.0")
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Models ──
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class HabitCreate(BaseModel):
    name: str
    icon: str = "circle"
    color: str = "#007AFF"
    frequency: str = "daily"

class GoalCreate(BaseModel):
    title: str
    description: str = ""
    target_value: float = 100.0
    unit: str = "%"
    deadline: str = ""

class GoalProgressUpdate(BaseModel):
    current_value: float

class VitalLogCreate(BaseModel):
    vital_type: str
    value: float

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class AIMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChallengeCreate(BaseModel):
    title: str
    description: str = ""
    challenge_type: str = "habit"
    duration_days: int = 7
    icon: str = "trophy"

class OnboardingData(BaseModel):
    fitness_level: str
    wellness_goals: List[str]
    selected_habits: List[str] = []

class FeedPostCreate(BaseModel):
    content: str
    post_type: str = "update"
    data: dict = {}


# ── Auth Helpers ──
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]

    # Try Supabase token first
    if supabase:
        try:
            sb_user = supabase.auth.get_user(token)
            if sb_user and sb_user.user:
                sb_email = sb_user.user.email
                result = await db.execute(select(User).where(User.email == sb_email))
                user = result.scalar_one_or_none()
                if user:
                    return user
        except Exception:
            pass

    # Fallback to local JWT
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload["user_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Auth Routes (Supabase + Local fallback) ──
@api_router.post("/auth/register")
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    supabase_token = None
    # Try Supabase Auth
    if supabase:
        try:
            sb_res = supabase.auth.sign_up({"email": data.email.lower(), "password": data.password})
            if sb_res.session:
                supabase_token = sb_res.session.access_token
        except Exception as e:
            logger.warning(f"Supabase auth failed, using local: {e}")

    user = User(
        id=str(uuid.uuid4()),
        name=data.name,
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        onboarding_complete=False
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = supabase_token or create_token(user.id)
    return {
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "onboarding_complete": False}
    }

@api_router.post("/auth/login")
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    supabase_token = None
    if supabase:
        try:
            sb_res = supabase.auth.sign_in_with_password({"email": data.email.lower(), "password": data.password})
            if sb_res.session:
                supabase_token = sb_res.session.access_token
        except Exception as e:
            logger.warning(f"Supabase login failed, using local: {e}")

    if not supabase_token and not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = supabase_token or create_token(user.id)
    return {
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "onboarding_complete": user.onboarding_complete}
    }

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "avatar_url": user.avatar_url, "bio": user.bio,
        "onboarding_complete": user.onboarding_complete
    }


# ── Onboarding ──
@api_router.post("/onboarding")
async def complete_onboarding(data: OnboardingData, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user.fitness_level = data.fitness_level
    user.wellness_goals = data.wellness_goals
    user.onboarding_complete = True
    await db.commit()

    # Auto-create selected habits
    for habit_name in data.selected_habits:
        template = next((t for t in HABIT_TEMPLATES if t["name"] == habit_name), None)
        if template:
            habit = Habit(
                id=str(uuid.uuid4()), user_id=user.id,
                name=template["name"], icon=template["icon"], color=template["color"],
                completed_dates=[]
            )
            db.add(habit)
    await db.commit()

    return {"status": "ok", "onboarding_complete": True}


# ── Habits Routes ──
HABIT_TEMPLATES = [
    {"name": "Drink Water", "icon": "droplets", "color": "#007AFF"},
    {"name": "Exercise", "icon": "dumbbell", "color": "#00D084"},
    {"name": "Read", "icon": "book-open", "color": "#FF9F0A"},
    {"name": "Meditate", "icon": "brain", "color": "#AF52DE"},
    {"name": "Sleep 8h", "icon": "moon", "color": "#5856D6"},
    {"name": "No Junk Food", "icon": "apple", "color": "#FF3B30"},
    {"name": "Walk 10k Steps", "icon": "footprints", "color": "#00D084"},
    {"name": "Journal", "icon": "pencil", "color": "#FF9F0A"},
]

@api_router.get("/habits/templates")
async def get_habit_templates():
    return HABIT_TEMPLATES

@api_router.get("/habits")
async def get_habits(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Habit).where(Habit.user_id == user.id).order_by(Habit.created_at.desc()))
    habits = result.scalars().all()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return [{
        "id": h.id, "name": h.name, "icon": h.icon, "color": h.color,
        "frequency": h.frequency, "completed_dates": h.completed_dates or [],
        "completed_today": today in (h.completed_dates or []),
        "streak": _calc_streak(h.completed_dates or [])
    } for h in habits]

def _calc_streak(dates):
    if not dates:
        return 0
    sorted_dates = sorted(dates, reverse=True)
    streak = 0
    today = datetime.now(timezone.utc).date()
    for i, d in enumerate(sorted_dates):
        expected = today - timedelta(days=i)
        if d == expected.strftime("%Y-%m-%d"):
            streak += 1
        else:
            break
    return streak

@api_router.post("/habits")
async def create_habit(data: HabitCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    habit = Habit(
        id=str(uuid.uuid4()), user_id=user.id,
        name=data.name, icon=data.icon, color=data.color, frequency=data.frequency,
        completed_dates=[]
    )
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return {"id": habit.id, "name": habit.name, "icon": habit.icon, "color": habit.color,
            "frequency": habit.frequency, "completed_dates": [], "completed_today": False, "streak": 0}

@api_router.post("/habits/{habit_id}/toggle")
async def toggle_habit(habit_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == user.id)))
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dates = list(habit.completed_dates or [])
    if today in dates:
        dates.remove(today)
    else:
        dates.append(today)
    habit.completed_dates = dates
    await db.commit()
    await db.refresh(habit)
    return {"id": habit.id, "completed_today": today in dates, "streak": _calc_streak(dates), "completed_dates": dates}

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == user.id)))
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    await db.delete(habit)
    await db.commit()
    return {"status": "deleted"}


# ── Goals Routes ──
@api_router.get("/goals")
async def get_goals(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Goal).where(Goal.user_id == user.id).order_by(Goal.created_at.desc()))
    goals = result.scalars().all()
    return [{"id": g.id, "title": g.title, "description": g.description, "target_value": g.target_value,
             "current_value": g.current_value, "unit": g.unit, "deadline": g.deadline,
             "progress": round((g.current_value / g.target_value * 100) if g.target_value > 0 else 0, 1)} for g in goals]

@api_router.post("/goals")
async def create_goal(data: GoalCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    goal = Goal(
        id=str(uuid.uuid4()), user_id=user.id,
        title=data.title, description=data.description,
        target_value=data.target_value, unit=data.unit, deadline=data.deadline
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return {"id": goal.id, "title": goal.title, "description": goal.description,
            "target_value": goal.target_value, "current_value": 0, "unit": goal.unit,
            "deadline": goal.deadline, "progress": 0}

@api_router.put("/goals/{goal_id}/progress")
async def update_goal_progress(goal_id: str, data: GoalProgressUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Goal).where(and_(Goal.id == goal_id, Goal.user_id == user.id)))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.current_value = data.current_value
    await db.commit()
    return {"id": goal.id, "current_value": goal.current_value,
            "progress": round((goal.current_value / goal.target_value * 100) if goal.target_value > 0 else 0, 1)}

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Goal).where(and_(Goal.id == goal_id, Goal.user_id == user.id)))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.commit()
    return {"status": "deleted"}


# ── Vitals Routes ──
@api_router.post("/vitals")
async def log_vital(data: VitalLogCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = await db.execute(
        select(Vital).where(and_(Vital.user_id == user.id, Vital.vital_type == data.vital_type, Vital.date == today))
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.value = data.value
        await db.commit()
        return {"id": existing.id, "vital_type": existing.vital_type, "value": existing.value, "date": today}
    vital = Vital(
        id=str(uuid.uuid4()), user_id=user.id,
        vital_type=data.vital_type, value=data.value, date=today
    )
    db.add(vital)
    await db.commit()
    await db.refresh(vital)
    return {"id": vital.id, "vital_type": vital.vital_type, "value": vital.value, "date": today}

@api_router.get("/vitals/today")
async def get_today_vitals(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = await db.execute(select(Vital).where(and_(Vital.user_id == user.id, Vital.date == today)))
    vitals = result.scalars().all()
    return {v.vital_type: v.value for v in vitals}

@api_router.get("/vitals/week")
async def get_week_vitals(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    week_ago = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    result = await db.execute(
        select(Vital).where(and_(Vital.user_id == user.id, Vital.date >= week_ago)).order_by(Vital.date)
    )
    vitals = result.scalars().all()
    by_date = {}
    for v in vitals:
        if v.date not in by_date:
            by_date[v.date] = {}
        by_date[v.date][v.vital_type] = v.value
    return [{"date": d, **vals} for d, vals in sorted(by_date.items())]


# ── Vibe Score & Analytics ──
@api_router.get("/analytics/vibe-score")
async def get_vibe_score(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    habits_res = await db.execute(select(Habit).where(Habit.user_id == user.id))
    habits = habits_res.scalars().all()
    habit_score = 0
    if habits:
        completed = sum(1 for h in habits if today in (h.completed_dates or []))
        habit_score = (completed / len(habits)) * 40

    vitals_res = await db.execute(select(Vital).where(and_(Vital.user_id == user.id, Vital.date == today)))
    vitals = {v.vital_type: v.value for v in vitals_res.scalars().all()}
    vital_checks = 0
    if vitals.get('water', 0) >= 6: vital_checks += 1
    if vitals.get('sleep', 0) >= 7: vital_checks += 1
    if vitals.get('mood', 0) >= 3: vital_checks += 1
    if vitals.get('steps', 0) >= 5000: vital_checks += 1
    vital_score = (vital_checks / 4) * 30

    goals_res = await db.execute(select(Goal).where(Goal.user_id == user.id))
    goals = goals_res.scalars().all()
    goal_score = 0
    if goals:
        avg_progress = sum((g.current_value / g.target_value * 100) if g.target_value > 0 else 0 for g in goals) / len(goals)
        goal_score = min(avg_progress, 100) / 100 * 30

    total = round(habit_score + vital_score + goal_score)
    return {"vibe_score": min(total, 100), "habit_score": round(habit_score), "vital_score": round(vital_score), "goal_score": round(goal_score)}

@api_router.get("/analytics/summary")
async def get_analytics_summary(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    week_dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]

    habits_res = await db.execute(select(Habit).where(Habit.user_id == user.id))
    habits = habits_res.scalars().all()
    daily_completions = []
    for d in reversed(week_dates):
        completed = sum(1 for h in habits if d in (h.completed_dates or []))
        daily_completions.append({"date": d, "completed": completed, "total": len(habits)})

    goals_res = await db.execute(select(Goal).where(Goal.user_id == user.id))
    goals = goals_res.scalars().all()
    goals_summary = [{"title": g.title, "progress": round((g.current_value / g.target_value * 100) if g.target_value > 0 else 0, 1)} for g in goals]

    week_ago = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    vitals_res = await db.execute(select(Vital).where(and_(Vital.user_id == user.id, Vital.date >= week_ago)))
    vitals = vitals_res.scalars().all()
    vitals_by_type = {}
    for v in vitals:
        if v.vital_type not in vitals_by_type:
            vitals_by_type[v.vital_type] = []
        vitals_by_type[v.vital_type].append({"date": v.date, "value": v.value})

    return {"daily_habits": daily_completions, "goals": goals_summary, "vitals_trends": vitals_by_type}


# ── Daily Quote ──
QUOTES = [
    {"text": "The only way to do great work is to love what you do.", "author": "Steve Jobs"},
    {"text": "Your body hears everything your mind says.", "author": "Naomi Judd"},
    {"text": "Take care of your body. It's the only place you have to live.", "author": "Jim Rohn"},
    {"text": "Happiness is the highest form of health.", "author": "Dalai Lama"},
    {"text": "The greatest wealth is health.", "author": "Virgil"},
    {"text": "Health is not valued till sickness comes.", "author": "Thomas Fuller"},
    {"text": "It is health that is real wealth and not pieces of gold and silver.", "author": "Mahatma Gandhi"},
    {"text": "To keep the body in good health is a duty.", "author": "Buddha"},
    {"text": "A healthy outside starts from the inside.", "author": "Robert Urich"},
    {"text": "Good health is not something we can buy. It is something we must invest in.", "author": "Unknown"},
    {"text": "An apple a day keeps the doctor away.", "author": "Proverb"},
    {"text": "Early to bed and early to rise makes a man healthy, wealthy, and wise.", "author": "Benjamin Franklin"},
    {"text": "Physical fitness is the first requisite of happiness.", "author": "Joseph Pilates"},
    {"text": "Movement is a medicine for creating change in a person's physical, emotional, and mental states.", "author": "Carol Welch"},
    {"text": "The mind and body are not separate. What affects one, affects the other.", "author": "Unknown"},
]

@api_router.get("/quote")
async def get_daily_quote():
    day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
    return QUOTES[day_of_year % len(QUOTES)]


# ── Profile Routes ──
@api_router.get("/profile")
async def get_profile(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    habits_res = await db.execute(select(func.count()).select_from(Habit).where(Habit.user_id == user.id))
    habits_count = habits_res.scalar()
    goals_res = await db.execute(select(func.count()).select_from(Goal).where(Goal.user_id == user.id))
    goals_count = goals_res.scalar()
    days = (datetime.now(timezone.utc) - user.created_at).days if user.created_at else 0
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "avatar_url": user.avatar_url, "bio": user.bio,
        "habits_count": habits_count, "goals_count": goals_count,
        "member_days": days, "fitness_level": user.fitness_level,
        "wellness_goals": user.wellness_goals or []
    }

@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if data.name is not None:
        user.name = data.name
    if data.bio is not None:
        user.bio = data.bio
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    await db.commit()
    return {"id": user.id, "name": user.name, "email": user.email, "avatar_url": user.avatar_url, "bio": user.bio}


# ── AI Coach ──
@api_router.post("/ai/coach")
async def ai_coach(data: AIMessageRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    session_id = data.session_id or str(uuid.uuid4())

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    habits_res = await db.execute(select(Habit).where(Habit.user_id == user.id))
    habits = habits_res.scalars().all()
    vitals_res = await db.execute(select(Vital).where(and_(Vital.user_id == user.id, Vital.date == today)))
    vitals = {v.vital_type: v.value for v in vitals_res.scalars().all()}

    habits_info = ", ".join([f"{h.name}({'done' if today in (h.completed_dates or []) else 'pending'})" for h in habits]) or "No habits yet"
    vitals_info = ", ".join([f"{k}: {v}" for k, v in vitals.items()]) or "No vitals logged today"

    system_msg = f"""You are Vibly AI Coach - a friendly, supportive wellness and health coach.
The user's name is {user.name}. Fitness level: {user.fitness_level or 'not set'}.
Their current habits: {habits_info}
Today's vitals: {vitals_info}
Be encouraging, give practical advice, keep responses concise (2-3 sentences max).
Use emojis sparingly. Never diagnose medical conditions."""

    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"vibly-{user.id}-{session_id}",
        system_message=system_msg
    )
    chat.with_model("openai", "gpt-4o-mini")
    response = await chat.send_message(UserMessage(text=data.message))

    user_msg = ChatMessage(id=str(uuid.uuid4()), user_id=user.id, session_id=session_id, role="user", content=data.message)
    ai_msg = ChatMessage(id=str(uuid.uuid4()), user_id=user.id, session_id=session_id, role="assistant", content=response)
    db.add(user_msg)
    db.add(ai_msg)
    await db.commit()

    return {"response": response, "session_id": session_id}

@api_router.get("/ai/history/{session_id}")
async def get_ai_history(session_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage).where(and_(ChatMessage.user_id == user.id, ChatMessage.session_id == session_id))
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    return [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat() if m.created_at else ""} for m in messages]


# ── Social Feed ──
@api_router.get("/feed")
async def get_feed(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FeedPost, User.name, User.avatar_url)
        .join(User, FeedPost.user_id == User.id)
        .order_by(desc(FeedPost.created_at))
        .limit(50)
    )
    rows = result.all()
    out = []
    for post, name, avatar in rows:
        liked_res = await db.execute(
            select(FeedLike).where(and_(FeedLike.post_id == post.id, FeedLike.user_id == user.id))
        )
        liked = liked_res.scalar_one_or_none() is not None
        out.append({
            "id": post.id, "user_name": name, "user_avatar": avatar or "",
            "post_type": post.post_type, "content": post.content,
            "data": post.data or {}, "likes_count": post.likes_count,
            "liked": liked, "is_mine": post.user_id == user.id,
            "created_at": post.created_at.isoformat() if post.created_at else ""
        })
    return out

@api_router.post("/feed")
async def create_feed_post(data: FeedPostCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    post = FeedPost(
        id=str(uuid.uuid4()), user_id=user.id,
        post_type=data.post_type, content=data.content, data=data.data
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return {
        "id": post.id, "user_name": user.name, "user_avatar": user.avatar_url or "",
        "post_type": post.post_type, "content": post.content,
        "data": post.data or {}, "likes_count": 0, "liked": False, "is_mine": True,
        "created_at": post.created_at.isoformat() if post.created_at else ""
    }

@api_router.post("/feed/{post_id}/like")
async def toggle_like(post_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(FeedLike).where(and_(FeedLike.post_id == post_id, FeedLike.user_id == user.id))
    )
    like = existing.scalar_one_or_none()
    post_res = await db.execute(select(FeedPost).where(FeedPost.id == post_id))
    post = post_res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if like:
        await db.delete(like)
        post.likes_count = max(0, post.likes_count - 1)
        liked = False
    else:
        new_like = FeedLike(id=str(uuid.uuid4()), post_id=post_id, user_id=user.id)
        db.add(new_like)
        post.likes_count = (post.likes_count or 0) + 1
        liked = True
    await db.commit()
    return {"liked": liked, "likes_count": post.likes_count}

@api_router.post("/feed/share-vibe")
async def share_vibe_card(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Auto-generate a vibe card post with current stats"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    habits_res = await db.execute(select(Habit).where(Habit.user_id == user.id))
    habits = habits_res.scalars().all()
    completed = sum(1 for h in habits if today in (h.completed_dates or []))
    longest_streak = max((_calc_streak(h.completed_dates or []) for h in habits), default=0)

    vitals_res = await db.execute(select(Vital).where(and_(Vital.user_id == user.id, Vital.date == today)))
    vitals = {v.vital_type: v.value for v in vitals_res.scalars().all()}

    post = FeedPost(
        id=str(uuid.uuid4()), user_id=user.id,
        post_type="vibe_card",
        content=f"Today's vibe check! {completed}/{len(habits)} habits done, {longest_streak} day streak!",
        data={
            "habits_done": completed, "habits_total": len(habits),
            "streak": longest_streak, "water": vitals.get("water", 0),
            "steps": vitals.get("steps", 0), "mood": vitals.get("mood", 0)
        }
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return {
        "id": post.id, "user_name": user.name, "content": post.content,
        "data": post.data, "post_type": "vibe_card"
    }


# ── Challenges ──
@api_router.get("/challenges")
async def get_challenges(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Challenge).order_by(Challenge.created_at.desc()))
    challenges = result.scalars().all()
    out = []
    for c in challenges:
        p_res = await db.execute(select(func.count()).select_from(ChallengeParticipant).where(ChallengeParticipant.challenge_id == c.id))
        participant_count = p_res.scalar()
        joined_res = await db.execute(
            select(ChallengeParticipant).where(and_(ChallengeParticipant.challenge_id == c.id, ChallengeParticipant.user_id == user.id))
        )
        joined = joined_res.scalar_one_or_none() is not None
        out.append({
            "id": c.id, "title": c.title, "description": c.description,
            "challenge_type": c.challenge_type, "duration_days": c.duration_days,
            "icon": c.icon, "participants": participant_count, "joined": joined
        })
    return out

@api_router.post("/challenges")
async def create_challenge(data: ChallengeCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    challenge = Challenge(
        id=str(uuid.uuid4()), title=data.title, description=data.description,
        challenge_type=data.challenge_type, duration_days=data.duration_days,
        icon=data.icon, created_by=user.id
    )
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)
    return {"id": challenge.id, "title": challenge.title, "description": challenge.description, "participants": 0, "joined": False}

@api_router.post("/challenges/{challenge_id}/join")
async def join_challenge(challenge_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(ChallengeParticipant).where(and_(ChallengeParticipant.challenge_id == challenge_id, ChallengeParticipant.user_id == user.id))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already joined")
    participant = ChallengeParticipant(id=str(uuid.uuid4()), challenge_id=challenge_id, user_id=user.id, checkin_dates=[])
    db.add(participant)
    await db.commit()
    return {"status": "joined"}

@api_router.post("/challenges/{challenge_id}/checkin")
async def checkin_challenge(challenge_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChallengeParticipant).where(and_(ChallengeParticipant.challenge_id == challenge_id, ChallengeParticipant.user_id == user.id))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=400, detail="Not joined")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dates = list(participant.checkin_dates or [])
    if today not in dates:
        dates.append(today)
    participant.checkin_dates = dates
    await db.commit()
    return {"status": "checked_in", "checkin_dates": dates}

@api_router.get("/challenges/{challenge_id}/leaderboard")
async def get_leaderboard(challenge_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChallengeParticipant, User.name).join(User, ChallengeParticipant.user_id == User.id)
        .where(ChallengeParticipant.challenge_id == challenge_id)
    )
    rows = result.all()
    board = sorted([{"name": r[1], "checkins": len(r[0].checkin_dates or []), "is_you": r[0].user_id == user.id} for r in rows], key=lambda x: -x["checkins"])
    return board


# ── Share ──
@api_router.get("/share")
async def get_share_data(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    habits_res = await db.execute(select(Habit).where(Habit.user_id == user.id))
    habits = habits_res.scalars().all()
    completed = sum(1 for h in habits if today in (h.completed_dates or []))
    longest_streak = max((_calc_streak(h.completed_dates or []) for h in habits), default=0)
    return {
        "name": user.name, "habits_today": f"{completed}/{len(habits)}",
        "longest_streak": longest_streak,
        "member_since": user.created_at.strftime("%b %Y") if user.created_at else "2026"
    }


# ── Health Check ──
@api_router.get("/health")
async def health():
    return {"status": "ok", "version": "2.1", "auth": "supabase+jwt"}


# ── Startup ──
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(Challenge))
        count = result.scalar()
        if count == 0:
            defaults = [
                Challenge(id=str(uuid.uuid4()), title="7-Day Hydration", description="Drink 8 glasses of water daily for 7 days", challenge_type="vital", duration_days=7, icon="droplets"),
                Challenge(id=str(uuid.uuid4()), title="30-Day Fitness", description="Exercise for at least 30 minutes every day", challenge_type="habit", duration_days=30, icon="dumbbell"),
                Challenge(id=str(uuid.uuid4()), title="Mindfulness Week", description="Meditate for 10 minutes daily for 7 days", challenge_type="habit", duration_days=7, icon="brain"),
                Challenge(id=str(uuid.uuid4()), title="Sleep Champion", description="Get 8 hours of sleep for 14 nights", challenge_type="vital", duration_days=14, icon="moon"),
                Challenge(id=str(uuid.uuid4()), title="Step Master", description="Walk 10,000 steps daily for 21 days", challenge_type="vital", duration_days=21, icon="footprints"),
            ]
            for c in defaults:
                db.add(c)
            await db.commit()
            logger.info("Seeded default challenges")


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()


app.include_router(api_router)
