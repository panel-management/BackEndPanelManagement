#!/bin/sh
set -e

echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx prisma db seed

echo "Starting app..."
pm2-runtime dist/src/main.js -i max
# exec node dist/src/main