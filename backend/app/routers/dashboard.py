from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Customer, Deal, User
from app.schemas import DashboardStats
from app.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    active_customers = db.query(func.count(Customer.id)).filter(Customer.status == "active").scalar() or 0

    pipeline_value = (
        db.query(func.coalesce(func.sum(Deal.value), 0.0))
        .filter(Deal.stage.in_(["new", "qualified", "proposal"]))
        .scalar()
    )
    won_value = (
        db.query(func.coalesce(func.sum(Deal.value), 0.0))
        .filter(Deal.stage == "won")
        .scalar()
    )

    # Deals by stage
    stages = ["new", "qualified", "proposal", "won", "lost"]
    deals_by_stage = {}
    for stage in stages:
        count = db.query(func.count(Deal.id)).filter(Deal.stage == stage).scalar() or 0
        deals_by_stage[stage] = count

    # Customers by status
    statuses = ["lead", "active", "churned"]
    customers_by_status = {}
    for s in statuses:
        count = db.query(func.count(Customer.id)).filter(Customer.status == s).scalar() or 0
        customers_by_status[s] = count

    return DashboardStats(
        total_customers=total_customers,
        active_customers=active_customers,
        pipeline_value=float(pipeline_value),
        won_value=float(won_value),
        deals_by_stage=deals_by_stage,
        customers_by_status=customers_by_status,
    )
