import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_token():
    resp = client.post("/api/auth/login", data={"username": "admin@fotihcrm.uz", "password": "admin123"})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    return None


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_login():
    resp = client.post("/api/auth/login", data={"username": "admin@fotihcrm.uz", "password": "admin123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_dashboard():
    token = get_token()
    if not token:
        pytest.skip("No token")
    resp = client.get("/api/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "total_customers" in data


def test_customers_list():
    token = get_token()
    if not token:
        pytest.skip("No token")
    resp = client.get("/api/customers", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


def test_deals_list():
    token = get_token()
    if not token:
        pytest.skip("No token")
    resp = client.get("/api/deals", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
