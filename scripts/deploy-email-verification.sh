#!/usr/bin/env bash
set -euo pipefail

echo "== Sikau Paisa: deploy email verification =="

if [[ ! -f .env ]]; then
  echo "Missing .env in $(pwd)"
  exit 1
fi

missing=0
for key in SMTP_USER SMTP_PASS; do
  if ! grep -q "^${key}=" .env; then
    echo "Missing ${key} in .env"
    missing=1
  fi
done
if [[ $missing -eq 1 ]]; then
  echo "Add SMTP settings to .env then rerun."
  echo "Example:"
  echo 'SMTP_HOST=smtp.gmail.com'
  echo 'SMTP_PORT=587'
  echo 'SMTP_USER=hello.sikaupaisa@gmail.com'
  echo 'SMTP_PASS=your-app-password'
  echo 'SMTP_FROM="Sikau Paisa <hello.sikaupaisa@gmail.com>"'
  exit 1
fi

git pull
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart all

echo "Done. Test:"
echo "  https://sikaupaisa.com/verify-email"
echo "  node scripts/send-test-email.mjs your@email.com"
