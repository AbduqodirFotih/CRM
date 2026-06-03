from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# Customer
class CustomerCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = "lead"
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Deal
class DealCreate(BaseModel):
    title: str
    value: Optional[float] = 0.0
    stage: Optional[str] = "new"
    customer_id: int
    description: Optional[str] = None


class DealUpdate(BaseModel):
    title: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    customer_id: Optional[int] = None
    description: Optional[str] = None


class DealResponse(BaseModel):
    id: int
    title: str
    value: float
    stage: str
    customer_id: int
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Dashboard
class DashboardStats(BaseModel):
    total_customers: int
    active_customers: int
    pipeline_value: float
    won_value: float
    deals_by_stage: dict
    customers_by_status: dict


# Infrastructure
class InstanceInfo(BaseModel):
    instance_id: str
    hostname: Optional[str] = None
    zone: str
    status: str
    request_count: int
    last_seen: datetime
    started_at: datetime

    class Config:
        from_attributes = True
