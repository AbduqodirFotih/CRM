import ssl
from urllib.parse import urlparse, parse_qs, urlunparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

db_url = DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+pg8000://", 1)
elif db_url.startswith("postgresql://") and "+pg8000" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)

parsed = urlparse(db_url)
query_params = parse_qs(parsed.query)

# Check if SSL was requested (Neon requires SSL)
requires_ssl = (
    "sslmode" in query_params
    or "neon.tech" in (parsed.hostname or "")
    or "aws" in (parsed.hostname or "")
)

# Remove psycopg2-specific parameters not accepted by pg8000
clean_params = {k: v[0] for k, v in query_params.items() if k not in ("sslmode", "channel_binding")}
new_query = "&".join(f"{k}={v}" for k, v in clean_params.items())
clean_url = urlunparse(parsed._replace(query=new_query))

connect_args = {}
if requires_ssl:
    ssl_context = ssl.create_default_context()
    connect_args["ssl_context"] = ssl_context

engine = create_engine(clean_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
