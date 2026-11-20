#!/bin/bash
# SSL sertifikatni yangilash va nginx-ni reload qilish
# Crontab: 0 3 * * 1 /opt/crm/scripts/renew-ssl.sh >> /var/log/crm-ssl-renew.log 2>&1

set -e
cd /opt/crm

docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot renew --webroot -w /var/www/certbot --quiet

# Nginx-ni yangi sertifikat bilan reload qilish
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "$(date): SSL yangilandi"
