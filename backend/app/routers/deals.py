from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import Deal, User
from app.schemas import DealCreate, DealUpdate, DealResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/deals", tags=["deals"])


@router.get("", response_model=List[DealResponse])
def list_deals(
    stage: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Deal)
    if stage:
        query = query.filter(Deal.stage == stage)
    if customer_id:
        query = query.filter(Deal.customer_id == customer_id)
    return query.order_by(Deal.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(deal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.post("", response_model=DealResponse, status_code=201)
def create_deal(data: DealCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deal = Deal(**data.model_dump())
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal


@router.put("/{deal_id}", response_model=DealResponse)
def update_deal(deal_id: int, data: DealUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(deal, key, value)
    db.commit()
    db.refresh(deal)
    return deal


@router.delete("/{deal_id}", status_code=204)
def delete_deal(deal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
