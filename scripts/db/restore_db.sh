#!/bin/bash

# A script to restore a PostgreSQL database from a SQL dump file.
# It drops the existing database, creates a new empty one, and then imports the data.

# Stop the script if any command fails
set -e

# The Docker container name
DB_CONTAINER="amps-db-1"

# Database connection details from the docker-compose.yml
DB_NAME="amps-db"
DB_USER="root"

# The SQL dump file you want to import
DUMP_FILE="backup.sql"


# Check if the dump file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo "Error: Dump file '$DUMP_FILE' not found in the current directory."
    exit 1
fi

echo "Starting database restore process..."

echo "   - Copying '$DUMP_FILE' to the container..."
docker cp "$DUMP_FILE" "$DB_CONTAINER:/tmp/$DUMP_FILE"

echo "   - Dropping the existing database '$DB_NAME'..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"

echo "   - Creating a new empty database '$DB_NAME'..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\" WITH OWNER = $DB_USER TEMPLATE = template0;"

echo "   - Importing data from '$DUMP_FILE'..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f "/tmp/$DUMP_FILE"


echo "Success! Database '$DB_NAME' has been restored from '$DUMP_FILE'."