#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# The name of your Keycloak application on Fly.io
APP_NAME="church-volunteers"
# The name for the associated Postgres database app
POSTGRES_APP_NAME="${APP_NAME}"
# The region to deploy to
PRIMARY_REGION="ord"
# VM size and memory
VM_SIZE="shared-cpu-1x"
VM_MEMORY="2048"

# --- Script Logic ---

echo "🚀 Starting Keycloak deployment for app: ${APP_NAME}"

# 1. Launch the app if fly.toml doesn't exist
if [ ! -f "fly.toml" ]; then
  echo "🔍 fly.toml not found. Launching new app without deploying..."
  fly launch --name "${APP_NAME}" --region "${PRIMARY_REGION}" --no-deploy
else
  echo "✅ fly.toml found."
fi

# 2. Create a Postgres database if it doesn't already exist
if ! fly status --app "${POSTGRES_APP_NAME}" > /dev/null 2>&1; then
  echo "🐘 Postgres app '${POSTGRES_APP_NAME}' not found. Creating..."
  fly postgres create --name "${POSTGRES_APP_NAME}" --region "${PRIMARY_REGION}" --vm-size "shared-cpu-1x" --volume-size 1
else
  echo "✅ Postgres app '${POSTGRES_APP_NAME}' already exists."
fi

# 3. Attach the database and capture the DATABASE_URL
echo "🔗 Attaching Postgres database..."
# The attach command outputs text before the URL, so we use sed to grab the URL.
DATABASE_URL=$(fly postgres attach "${POSTGRES_APP_NAME}" --app "${APP_NAME}" | grep DATABASE_URL | sed -n 's/.*\(postgres:\/\/.*\).*/\1/p')

if [ -z "${DATABASE_URL}" ]; then
  echo "❌ Error: Could not capture DATABASE_URL. Please check the 'fly postgres attach' command output."
  exit 1
fi

echo "✅ Successfully captured DATABASE_URL."

# 4. Parse the DATABASE_URL
# Format: postgres://<user>:<password>@<host>:<port>/<db>
DB_PARTS=$(echo "${DATABASE_URL}" | sed -n 's/postgres:\/\/\([^:]*\):\([^@]*\)@\([^:]*\):\([0-9]*\)\/\(.*\)/\1 \2 \3 \5/p')
read -r KC_DB_USERNAME KC_DB_PASSWORD KC_DB_HOST KC_DB_NAME <<< "${DB_PARTS}"

# 5. Set secrets
ADMIN_PASSWORD="change_me"
echo "🔒 Setting secrets..."
fly secrets set -a "${APP_NAME}" \
  KC_DB="postgres" \
  KC_DB_URL="jdbc:postgresql://${KC_DB_HOST}:5432/${KC_DB_NAME}?sslmode=disable" \
  KC_DB_USERNAME="${KC_DB_USERNAME}" \
  KC_DB_PASSWORD="${KC_DB_PASSWORD}" \
  KC_HOSTNAME="${APP_NAME}.fly.dev" \
  KC_BOOTSTRAP_ADMIN_USERNAME="admin" \
  KC_BOOTSTRAP_ADMIN_PASSWORD="${ADMIN_PASSWORD}"

# 6. Deploy the application
echo "🚢 Deploying Keycloak..."
fly deploy --app "${APP_NAME}"

# 7. Scale the VM
echo "💪 Scaling VM to ${VM_SIZE} with ${VM_MEMORY}MB memory..."
fly scale vm "${VM_SIZE}" --memory "${VM_MEMORY}" --app "${APP_NAME}"

# 8. Print next steps
ADMIN_URL="https://${APP_NAME}.fly.dev/admin/"
echo "\n🎉 Deployment complete!"
echo "\nNext Steps:"
echo "1. Visit the admin console: ${ADMIN_URL}"
echo "2. Log in with username 'admin' and password '${ADMIN_PASSWORD}'"
echo "3. IMPORTANT: Change the admin password immediately!"
