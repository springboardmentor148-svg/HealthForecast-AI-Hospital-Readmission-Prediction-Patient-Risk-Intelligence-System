#!/bin/sh
set -e

# Retry migration until database is accessible
echo "Waiting for database to become available and executing migrations..."
until flask db upgrade; do
  echo "Migrations failed (database might still be booting). Retrying in 2 seconds..."
  sleep 2
done

echo "Database migrations applied successfully."

# Start Flask application using Gunicorn
echo "Launching Flask backend with Gunicorn..."
exec gunicorn -w 1 -b 0.0.0.0:5000 "run:app"
