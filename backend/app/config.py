import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://crmuser:crmpass@db:5432/crmdb")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
