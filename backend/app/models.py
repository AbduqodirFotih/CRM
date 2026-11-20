from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(50))
    company = Column(String(255))
    status = Column(String(20), default="lead")  # lead, active, churned
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    deals = relationship("Deal", back_populates="customer")


class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    value = Column(Float, default=0.0)
    stage = Column(String(20), default="new")  # new, qualified, proposal, won, lost
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer", back_populates="deals")


class InstanceHeartbeat(Base):
    __tablename__ = "instance_heartbeats"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(String(255), unique=True, index=True, nullable=False)
    hostname = Column(String(255))
    zone = Column(String(50), default="eu-west-1a")
    status = Column(String(20), default="healthy")
    request_count = Column(Integer, default=0)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
