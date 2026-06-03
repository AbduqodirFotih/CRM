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
    existing = db.query(User).filter(User.email == "admin@fotihcrm.uz").first()
    if existing:
        return

    try:
        # Admin user
        admin = User(
            email="admin@fotihcrm.uz",
            hashed_password=get_password_hash("admin123"),
            full_name="Abduqodir Fotih",
        )
        db.add(admin)
        db.flush()

        # Customers (20 ta)
        customers_data = [
            {"name": "Acme Corp", "email": "contact@acme.com", "company": "Acme Corporation", "status": "active", "phone": "+1-555-0101"},
            {"name": "GlobalTech", "email": "info@globaltech.io", "company": "GlobalTech Inc", "status": "active", "phone": "+1-555-0102"},
            {"name": "StartupXYZ", "email": "hello@startupxyz.com", "company": "StartupXYZ", "status": "lead", "phone": "+1-555-0103"},
            {"name": "MegaCorp", "email": "sales@megacorp.net", "company": "MegaCorp Ltd", "status": "churned", "phone": "+1-555-0104"},
            {"name": "TechVision", "email": "info@techvision.com", "company": "TechVision AI", "status": "active", "phone": "+1-555-0105"},
            {"name": "CloudFirst", "email": "hello@cloudfirst.io", "company": "CloudFirst Solutions", "status": "active", "phone": "+1-555-0106"},
            {"name": "DataStream", "email": "contact@datastream.dev", "company": "DataStream Analytics", "status": "lead", "phone": "+1-555-0107"},
            {"name": "NetPulse", "email": "sales@netpulse.com", "company": "NetPulse Networks", "status": "active", "phone": "+1-555-0108"},
            {"name": "CyberShield", "email": "info@cybershield.io", "company": "CyberShield Security", "status": "active", "phone": "+1-555-0109"},
            {"name": "SmartOps", "email": "ops@smartops.co", "company": "SmartOps Automation", "status": "lead", "phone": "+1-555-0110"},
            {"name": "InnoHub", "email": "team@innohub.tech", "company": "InnoHub Technologies", "status": "active", "phone": "+1-555-0111"},
            {"name": "QuantumLeap", "email": "hello@quantumleap.ai", "company": "QuantumLeap AI", "status": "lead", "phone": "+1-555-0112"},
            {"name": "EcoTech", "email": "green@ecotech.org", "company": "EcoTech Solutions", "status": "churned", "phone": "+1-555-0113"},
            {"name": "BlueSky Labs", "email": "lab@bluesky.io", "company": "BlueSky Laboratories", "status": "active", "phone": "+1-555-0114"},
            {"name": "RapidScale", "email": "scale@rapidscale.com", "company": "RapidScale Cloud", "status": "lead", "phone": "+1-555-0115"},
            {"name": "DevForge", "email": "forge@devforge.dev", "company": "DevForge Studios", "status": "active", "phone": "+1-555-0116"},
            {"name": "NexGen", "email": "info@nexgen.co", "company": "NexGen Platforms", "status": "churned", "phone": "+1-555-0117"},
            {"name": "PeakSoft", "email": "hello@peaksoft.uz", "company": "PeakSoft Academy", "status": "active", "phone": "+998-90-123-4567"},
            {"name": "SilkRoad Digital", "email": "info@silkroad.digital", "company": "SilkRoad Digital", "status": "lead", "phone": "+998-91-234-5678"},
            {"name": "Falcon Systems", "email": "sales@falcon.systems", "company": "Falcon Systems Ltd", "status": "active", "phone": "+44-20-7946-0958"},
        ]
        customer_objects = []
        for c in customers_data:
            cust = Customer(**c)
            db.add(cust)
            customer_objects.append(cust)
        db.flush()

        # Deals (15 ta)
        deals_data = [
            {"title": "Enterprise License", "value": 50000.0, "stage": "won", "customer_id": customer_objects[0].id},
            {"title": "Cloud Migration Project", "value": 75000.0, "stage": "proposal", "customer_id": customer_objects[1].id},
            {"title": "Consulting Package", "value": 15000.0, "stage": "qualified", "customer_id": customer_objects[2].id},
            {"title": "Annual Support Contract", "value": 12000.0, "stage": "new", "customer_id": customer_objects[4].id},
            {"title": "Data Analytics Platform", "value": 42000.0, "stage": "won", "customer_id": customer_objects[5].id},
            {"title": "Security Audit", "value": 28000.0, "stage": "won", "customer_id": customer_objects[8].id},
            {"title": "AI Integration", "value": 95000.0, "stage": "proposal", "customer_id": customer_objects[11].id},
            {"title": "DevOps Setup", "value": 35000.0, "stage": "qualified", "customer_id": customer_objects[15].id},
            {"title": "Network Redesign", "value": 60000.0, "stage": "new", "customer_id": customer_objects[7].id},
            {"title": "Mobile App Development", "value": 85000.0, "stage": "proposal", "customer_id": customer_objects[10].id},
            {"title": "Cloud Hosting (3yr)", "value": 36000.0, "stage": "won", "customer_id": customer_objects[13].id},
            {"title": "Training Program", "value": 8500.0, "stage": "qualified", "customer_id": customer_objects[17].id},
            {"title": "ERP Integration", "value": 120000.0, "stage": "new", "customer_id": customer_objects[19].id},
            {"title": "Cybersecurity Suite", "value": 55000.0, "stage": "lost", "customer_id": customer_objects[3].id},
            {"title": "Legacy Migration", "value": 48000.0, "stage": "lost", "customer_id": customer_objects[12].id},
        ]
        for d in deals_data:
            db.add(Deal(**d))

        db.commit()
    except Exception:
        db.rollback()


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
    # Startup — create tables (safe for concurrent access)
    import time as _time
    import random as _random
    _time.sleep(_random.uniform(0, 1))  # stagger startup to avoid race
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass  # tables already exist from another instance
    
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


app = FastAPI(title="Fotih CRM API", version="1.0.0", lifespan=lifespan)

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
