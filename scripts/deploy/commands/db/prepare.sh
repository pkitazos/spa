#!/usr/bin/env bash

pushd $AMPS_BACKUP_DIR

LATEST_BACKUP=$(ls -t *.gz | head -n 1)

if [ ! -z $LATEST_BACKUP ]; then
    echo "Error: No .gz backup files found in '$AMPS_BACKUP_DIR'."
    exit 1
fi

cp "$LATEST_BACKUP" "~"

popd
