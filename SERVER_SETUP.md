# Server Setup — crm.abduqodir-jamalov.uz

## Serverda bir marta bajarish kerak bo'lgan ishlar

### 1. Domain DNS sozlash
DNS provayderda **A record** qo'shing:
```
crm.abduqodir-jamalov.uz  →  <server IP>
```
DNS tarqalgandan keyin davom eting (odatda 5–30 daqiqa).

---

### 2. Serverga Docker o'rnatish
```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER
```

---

### 3. GitHub Secrets sozlash
GitHub repo → Settings → Secrets and variables → Actions:

| Secret nomi     | Qiymati                              |
|-----------------|--------------------------------------|
| `SERVER_HOST`   | Server IP yoki hostname              |
| `SERVER_USER`   | SSH user (masalan: `ubuntu`)         |
| `SSH_PRIVATE_KEY` | SSH private key (id_rsa mazmuни)  |
| `SECRET_KEY`    | Kuchli tasodifiy string (JWT uchun)  |
| `DB_PASSWORD`   | PostgreSQL paroli                    |

---

### 4. Papkalar tayyorlash (serverda)
```bash
mkdir -p /opt/crm /etc/letsencrypt /var/www/certbot
chmod 755 /opt/crm
```

---

### 5. Deploy
`main` branchga push qiling — GitHub Actions avtomatik:
1. Docker image larni build qiladi (GHCR ga push)
2. Serverga `docker-compose.prod.yml` ko'chiradi
3. **Birinchi marta SSL sertifikat oladi** (Let's Encrypt / Certbot)
4. Stack ni ishga tushiradi: `db + api + nginx (80+443) + certbot`

---

### 6. SSL avtomatik yangilash (cron)
Serverda quyidagini bajaring:
```bash
chmod +x /opt/crm/scripts/renew-ssl.sh

# Crontab ochish
crontab -e

# Quyidagi satrni qo'shing (har dushanba soat 03:00 da yangilanadi)
0 3 * * 1 /opt/crm/scripts/renew-ssl.sh >> /var/log/crm-ssl-renew.log 2>&1
```

---

### Arxitektura
```
Internet
   │
   ▼
[80]  nginx  [443]   ← Let's Encrypt SSL
       │
       ├── /api/*  → api:8000  (FastAPI)
       └── /*      → /usr/share/nginx/html  (React SPA)
              │
              db:5432  (PostgreSQL)
```

---

### Foydali buyruqlar
```bash
# Loglarni ko'rish
docker compose -f /opt/crm/docker-compose.prod.yml logs -f nginx

# Stack holatini tekshirish
docker compose -f /opt/crm/docker-compose.prod.yml ps

# SSL sertifikat muddatini tekshirish
docker run --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certificates
```
