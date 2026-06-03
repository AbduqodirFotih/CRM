import os
import socket
import threading
import time
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal, Base
from app.models import User, Customer, Deal, InstanceHeartbeat
from app.auth import get_password_hash
from app.routers import auth, customers, deals, dashboard, infrastructure


INSTANCE_ID = os.getenv("HOSTNAME", socket.gethostname())


def seed_data(db: Session):
    """Seed demo data if DB is empty."""
    if db.query(User).first():
        return

    # Admin user
    admin = User(
        email="admin@cloudcrm.dev",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin User",
    )
    db.add(admin)
    db.flush()

    # Customers
    customers_data = [
        {"name": "Acme Corp", "email": "contact@acme.com", "company": "Acme Corp", "status": "active", "phone": "+1-555-0101"},
        {"name": "GlobalTech", "email": "info@globaltech.io", "company": "GlobalTech Inc", "status": "active", "phone": "+1-555-0102"},
        {"name": "StartupXYZ", "email": "hello@startupxyz.com", "company": "StartupXYZ", "status": "lead", "phone": "+1-555-0103"},
        {"name": "MegaCorp", "email": "sales@megacorp.net", "company": "MegaCorp Ltd", "status": "churned", "phone": "+1-555-0104"},
    ]
    customer_objects = []
    for c in customers_data:
        cust = Customer(**c)
        db.add(cust)
        customer_objects.append(cust)
    db.flush()

    # Deals
    deals_data = [
        {"title": "Enterprise License", "value": 50000.0, "stage": "won", "customer_id": customer_objects[0].id},
        {"title": "Cloud Migration", "value": 35000.0, "stage": "proposal", "customer_id": customer_objects[1].id},
        {"title": "Consulting Package", "value": 15000.0, "stage": "qualified", "customer_id": customer_objects[2].id},
        {"title": "Support Contract", "value": 8000.0, "stage": "new", "customer_id": customer_objects[0].id},
        {"title": "Data Analytics", "value": 22000.0, "stage": "lost", "customer_id": customer_objects[3].id},
    ]
    for d in deals_data:
        db.add(Deal(**d))

    db.commit()


def heartbeat_loop():
    """Background thread to send heartbeats to DB."""
    while True:
        try:
            db = SessionLocal()
            instance = db.query(InstanceHeartbeat).filter(InstanceHeartbeat.instance_id == INSTANCE_ID).first()
            if instance:
                instance.last_seen = datetime.now(timezone.utc)
                instance.status = "healthy"
            else:
                instance = InstanceHeartbeat(
                    instance_id=INSTANCE_ID,
                    hostname=INSTANCE_ID,
                    zone="eu-west-1a",
                    status="healthy",
                    request_count=0,
                )
                db.add(instance)
            db.commit()
            db.close()
        except Exception:
            pass
        time.sleep(5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_data(db)
    db.close()

    # Start heartbeat thread
    t = threading.Thread(target=heartbeat_loop, daemon=True)
    t.start()

    yield

    # Shutdown — mark instance as gone
    try:
        db = SessionLocal()
        instance = db.query(InstanceHeartbeat).filter(InstanceHeartbeat.instance_id == INSTANCE_ID).first()
        if instance:
            db.delete(instance)
            db.commit()
        db.close()
    except Exception:
        pass


app = FastAPI(title="CloudCRM API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def count_requests(request: Request, call_next):
    response = await call_next(request)
    # Increment request count
    if request.url.path.startswith("/api/"):
        try:
            db = SessionLocal()
            instance = db.query(InstanceHeartbeat).filter(InstanceHeartbeat.instance_id == INSTANCE_ID).first()
            if instance:
                instance.request_count = (instance.request_count or 0) + 1
                db.commit()
            db.close()
        except Exception:
            pass
    return response


@app.get("/api/health")
def health():
    return {"status": "healthy", "instance_id": INSTANCE_ID}


app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(deals.router)
app.include_router(dashboard.router)
app.include_router(infrastructure.router)
