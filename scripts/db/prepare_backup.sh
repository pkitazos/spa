#!/bin/bash

# A script to prepare the latest PostgreSQL database backup for transfer.
# It finds the most recent .gz backup file, copies it to /tmp/,
# and renames it to backup.gz.

# --- Configuration ---
# Stop the script if any command fails
set -e

# This assumes the script is run from the 'spa' directory.
BACKUPS_DIR="../spa-backups/backups"

# The target directory on the server where the prepared backup will be placed
TARGET_DIR="/tmp"
TARGET_FILENAME="backup.gz"
# --- End of Configuration ---

echo "Starting backup preparation on server..."

# Check if the backups directory exists
if [ ! -d "$BACKUPS_DIR" ]; then
    echo "Error: Backups directory '$BACKUPS_DIR' not found."
    echo "Please ensure the script is run from the 'spa' directory."
    exit 1
fi

# Find the latest .gz backup file
echo "   - Searching for the latest backup in '$BACKUPS_DIR'..."
LATEST_BACKUP=$(ls -t "$BACKUPS_DIR"/*.gz | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "Error: No .gz backup files found in '$BACKUPS_DIR'."
    exit 1
fi

echo "   - Found latest backup: '$(basename "$LATEST_BACKUP")'"

# Construct the full target path
TARGET_PATH="${TARGET_DIR}/${TARGET_FILENAME}"

# Copy the latest backup to the target directory and rename it
echo "   - Copying '$(basename "$LATEST_BACKUP")' to '$TARGET_PATH'..."
cp "$LATEST_BACKUP" "$TARGET_PATH"

echo "Success! Latest backup prepared at '$TARGET_PATH'."
echo "You can now securely copy this file to your local machine."