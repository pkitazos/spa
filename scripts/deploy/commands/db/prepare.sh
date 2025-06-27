#!/usr/bin/env bash

pushd $AMPS_DB_BACKUP_DIR

latestBackup=$(ls -t *.gz | head -n 1)

if [ ! -z $latestBackup ]; then
    echo "Error: No .gz backup files found in '$AMPS_DB_BACKUP_DIR'."
    exit 1
fi

cp "$latestBackup" "~"

popd
