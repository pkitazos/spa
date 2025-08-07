#!/usr/bin/env bash

dumpFile=$1

if [ ! -f "$dumpFile" ]; then
    echo "Error: Dump file '$dumpFile' not found in the current directory."
    exit 1
fi

docker cp "$dumpFile" "amps-db-1:db-image.sql"

# TODO
# Ideally, we want to do this as a single transaction.
# Not sure if that's possible though...
docker exec amps-db-1 psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
docker exec amps-db-1 psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\" WITH OWNER = $DB_USER;"
docker exec amps-db-1 psql -U "$DB_USER" -d "$DB_NAME" -f "db-image.sql"
