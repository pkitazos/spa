#!/bin/bash

set -o allexport
source .env
set +o allexport


OUTFILE="db-dump.sql"

echo "Creating dump of database '${DB_NAME}'..."

pg_dump --clean --if-exists -h localhost -p 6565 -U "${DB_USER}" -d "${DB_NAME}" > "${OUTFILE}"

echo "Dump complete. File created: ${OUTFILE}"