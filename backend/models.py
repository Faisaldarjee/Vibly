import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = 'users'
    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(500), default='')
    bio = Column(Text, default='')
    created_at = Column(DateTime(timezone=True), default=utc_now)

    habits = relationship('Habit', back_populates='user', cascade='all, delete-orphan')
    goals = relationship('Goal', back_populates='user', cascade='all, delete-orphan')
    vitals = relationship('Vital', back_populates='user', cascade='all, delete-orphan')
    chat_messages = relationship('ChatMessage', back_populates='user', cascade='all, delete-orphan')


class Habit(Base):
    __tablename__ = 'habits'
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    icon = Column(String(50), default='circle')
    color = Column(String(20), default='#007AFF')
    frequency = Column(String(20), default='daily')
    completed_dates = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship('User', back_populates='habits')


class Goal(Base):
    __tablename__ = 'goals'
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default='')
    target_value = Column(Float, default=100.0)
    current_value = Column(Float, default=0.0)
    unit = Column(String(50), default='%')
    deadline = Column(String(50), default='')
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship('User', back_populates='goals')


class Vital(Base):
    __tablename__ = 'vitals'
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    vital_type = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    date = Column(String(20), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship('User', back_populates='vitals')


class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship('User', back_populates='chat_messages')


class Challenge(Base):
    __tablename__ = 'challenges'
    id = Column(String(36), primary_key=True, default=gen_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, default='')
    challenge_type = Column(String(50), default='habit')
    duration_days = Column(Integer, default=7)
    icon = Column(String(50), default='trophy')
    created_by = Column(String(36), default='system')
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ChallengeParticipant(Base):
    __tablename__ = 'challenge_participants'
    id = Column(String(36), primary_key=True, default=gen_uuid)
    challenge_id = Column(String(36), ForeignKey('challenges.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    checkin_dates = Column(JSON, default=list)
    joined_at = Column(DateTime(timezone=True), default=utc_now)
