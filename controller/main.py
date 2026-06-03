import os
import time
import threading
from datetime import datetime, timezone
from typing import Optional

import docker
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, declarative_base, Session, Mapped, mapped_column

# Config
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://crmuser:crmpass@db:5432/crmdb")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
MIN_INSTANCES = int(os.getenv("MIN_INSTANCES", "1"))
MAX_INSTANCES = int(os.getenv("MAX_INSTANCES", "6"))
SCALE_UP_RPS = int(os.getenv("SCALE_UP_RPS", "50"))
SCALE_DOWN_RPS = int(os.getenv("SCALE_DOWN_RPS", "10"))
COOLDOWN_SECONDS = int(os.getenv("COOLDOWN_SECONDS", "15"))
AUTOSCALER_INTERVAL = int(os.getenv("AUTOSCALER_INTERVAL", "10"))

# DB setup
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class InstanceHeartbeat(Base):
    __tablename__ = "instance_heartbeats"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    instance_id: Mapped[str] = mapped_column(unique=True, index=True)
    hostname: Mapped[Optional[str]] = mapped_column(default=None)
    zone: Mapped[str] = mapped_column(default="eu-west-1a")
    status: Mapped[str] = mapped_column(default="healthy")
    request_count: Mapped[int] = mapped_column(default=0)
    last_seen: Mapped[Optional[datetime]] = mapped_column(default=None)
    started_at: Mapped[Optional[datetime]] = mapped_column(default=None)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Auth
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


# Docker client
docker_client = docker.from_env()

# Autoscaler state
autoscaler_enabled = False
last_scale_time = 0.0
last_total_requests = 0
last_rps = 0.0
last_scale_reason = ""

app = FastAPI(title="CloudCRM Controller", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_project_name():
    """Detect docker compose project name from current containers."""
    try:
        containers = docker_client.containers.list(filters={"label": "com.docker.compose.service=api"})
        if containers:
            return containers[0].labels.get("com.docker.compose.project", "crm")
    except Exception:
        pass
    return "crm"


def get_api_containers():
    """Get all API containers."""
    try:
        return docker_client.containers.list(
            all=True, filters={"label": "com.docker.compose.service=api"}
        )
    except Exception:
        return []


def get_running_api_containers():
    return [c for c in get_api_containers() if c.status == "running"]


class ScaleRequest(BaseModel):
    count: int


class AutoscalerConfig(BaseModel):
    enabled: bool


@app.get("/api/control/health")
def health():
    return {"status": "healthy", "service": "controller"}


@app.get("/api/control/status")
def get_status(user: str = Depends(verify_token)):
    running = get_running_api_containers()
    return {
        "running_instances": len(running),
        "min_instances": MIN_INSTANCES,
        "max_instances": MAX_INSTANCES,
        "autoscaler_enabled": autoscaler_enabled,
        "last_rps": last_rps,
        "last_scale_reason": last_scale_reason,
        "cooldown_seconds": COOLDOWN_SECONDS,
        "cooldown_remaining": max(0, COOLDOWN_SECONDS - (time.time() - last_scale_time)),
    }


@app.post("/api/control/scale")
def scale_instances(req: ScaleRequest, user: str = Depends(verify_token)):
    global last_scale_time, last_scale_reason
    target = max(MIN_INSTANCES, min(MAX_INSTANCES, req.count))
    running = get_running_api_containers()
    current = len(running)

    if target == current:
        return {"message": f"Already at {current} instances", "current": current}

    if target > current:
        # Scale up
        added = 0
        project = get_project_name()
        for i in range(target - current):
            try:
                # Find network
                networks = docker_client.networks.list(filters={"label": f"com.docker.compose.project={project}"})
                private_net = None
                for net in networks:
                    if "private" in net.name:
                        private_net = net
                        break
                if not private_net and networks:
                    private_net = networks[0]

                # Get image from existing container
                if running:
                    image = running[0].image.tags[0] if running[0].image.tags else running[0].image.id
                else:
                    image = f"{project}-api:latest"

                # Get env from existing container
                env_vars = {}
                if running:
                    env_list = running[0].attrs.get("Config", {}).get("Env", [])
                    for e in env_list:
                        k, _, v = e.partition("=")
                        env_vars[k] = v

                container = docker_client.containers.run(
                    image,
                    detach=True,
                    environment=env_vars,
                    labels={
                        "com.docker.compose.service": "api",
                        "com.docker.compose.project": project,
                    },
                    network=private_net.name if private_net else None,
                    name=None,
                    hostname=None,
                )
                # Add network alias
                if private_net:
                    private_net.disconnect(container)
                    private_net.connect(container, aliases=["api"])

                added += 1
            except Exception as e:
                return {"error": str(e), "added": added}

        last_scale_time = time.time()
        last_scale_reason = f"Manual scale up to {target}"
        return {"message": f"Scaled up to {target}", "added": added, "current": current + added}
    else:
        # Scale down
        removed = 0
        to_remove = current - target
        # Remove newest first (reverse order)
        sorted_containers = sorted(running, key=lambda c: c.attrs["Created"], reverse=True)
        for container in sorted_containers[:to_remove]:
            try:
                container.stop(timeout=5)
                container.remove()
                removed += 1
            except Exception:
                pass

        last_scale_time = time.time()
        last_scale_reason = f"Manual scale down to {target}"
        return {"message": f"Scaled down to {target}", "removed": removed, "current": current - removed}


@app.post("/api/control/autoscaler")
def set_autoscaler(config: AutoscalerConfig, user: str = Depends(verify_token)):
    global autoscaler_enabled
    autoscaler_enabled = config.enabled
    return {"autoscaler_enabled": autoscaler_enabled}


@app.post("/api/control/drain/{instance_id}")
def drain_instance(instance_id: str, user: str = Depends(verify_token)):
    """Mark an instance for draining (stop accepting new requests)."""
    db = next(get_db())
    instance = db.query(InstanceHeartbeat).filter(InstanceHeartbeat.instance_id == instance_id).first()
    if instance:
        instance.status = "draining"
        db.commit()
        return {"message": f"Instance {instance_id} marked for draining"}
    raise HTTPException(status_code=404, detail="Instance not found")


@app.delete("/api/control/instance/{instance_id}")
def deregister_instance(instance_id: str, user: str = Depends(verify_token)):
    """Stop and remove a specific container."""
    containers = get_api_containers()
    running = get_running_api_containers()
    if len(running) <= MIN_INSTANCES:
        raise HTTPException(status_code=400, detail=f"Cannot go below {MIN_INSTANCES} instances")

    for c in containers:
        hostname = c.attrs["Config"]["Hostname"]
        if hostname == instance_id or c.short_id == instance_id or c.name == instance_id:
            try:
                c.stop(timeout=5)
                c.remove()
                # Clean up heartbeat
                db = next(get_db())
                hb = db.query(InstanceHeartbeat).filter(InstanceHeartbeat.instance_id == instance_id).first()
                if hb:
                    db.delete(hb)
                    db.commit()
                return {"message": f"Instance {instance_id} deregistered"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(status_code=404, detail="Container not found")


def autoscaler_loop():
    """Background autoscaler thread."""
    global last_scale_time, last_total_requests, last_rps, last_scale_reason, autoscaler_enabled
    last_total_requests = 0

    while True:
        time.sleep(AUTOSCALER_INTERVAL)
        if not autoscaler_enabled:
            continue

        # Cooldown check
        if time.time() - last_scale_time < COOLDOWN_SECONDS:
            continue

        try:
            db_session = SessionLocal()
            total_requests = db_session.query(func.coalesce(func.sum(InstanceHeartbeat.request_count), 0)).scalar()
            db_session.close()

            rps = (total_requests - last_total_requests) / AUTOSCALER_INTERVAL
            last_rps = max(0, rps)
            last_total_requests = total_requests

            running = get_running_api_containers()
            current = len(running)

            if last_rps > SCALE_UP_RPS and current < MAX_INSTANCES:
                # Scale up by 1
                try:
                    from main import scale_instances, ScaleRequest
                except ImportError:
                    pass
                project = get_project_name()
                networks = docker_client.networks.list(filters={"label": f"com.docker.compose.project={project}"})
                private_net = None
                for net in networks:
                    if "private" in net.name:
                        private_net = net
                        break
                if not private_net and networks:
                    private_net = networks[0]
                if running:
                    image = running[0].image.tags[0] if running[0].image.tags else running[0].image.id
                    env_list = running[0].attrs.get("Config", {}).get("Env", [])
                    env_vars = {}
                    for e in env_list:
                        k, _, v = e.partition("=")
                        env_vars[k] = v
                    container = docker_client.containers.run(
                        image, detach=True, environment=env_vars,
                        labels={"com.docker.compose.service": "api", "com.docker.compose.project": project},
                        network=private_net.name if private_net else None,
                    )
                    if private_net:
                        private_net.disconnect(container)
                        private_net.connect(container, aliases=["api"])
                    last_scale_time = time.time()
                    last_scale_reason = f"Autoscale UP: RPS={last_rps:.1f} > {SCALE_UP_RPS}"

            elif last_rps < SCALE_DOWN_RPS and current > MIN_INSTANCES:
                # Scale down by 1
                sorted_containers = sorted(running, key=lambda c: c.attrs["Created"], reverse=True)
                if sorted_containers:
                    sorted_containers[0].stop(timeout=5)
                    sorted_containers[0].remove()
                    last_scale_time = time.time()
                    last_scale_reason = f"Autoscale DOWN: RPS={last_rps:.1f} < {SCALE_DOWN_RPS}"

        except Exception:
            pass


# Start autoscaler thread
threading.Thread(target=autoscaler_loop, daemon=True).start()
