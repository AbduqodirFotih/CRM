from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import InstanceHeartbeat, User
from app.schemas import InstanceInfo
from app.auth import get_current_user

router = APIRouter(prefix="/api/infra", tags=["infrastructure"])


@router.get("/instances", response_model=List[InstanceInfo])
def list_instances(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    instances = db.query(InstanceHeartbeat).order_by(InstanceHeartbeat.started_at.asc()).all()
    return instances
