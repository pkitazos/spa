#!/usr/bin/env bash

pushd $AMPS_DB_BACKUP_DIR >/dev/null

timestamp=$(date --iso-8601=seconds)
outfile=db-image-$timestamp.sql

docker exec amps-db-1 pg_dump -d 'amps-db' >$outfile

gzip $outfile

if [ ! -z $AMPS_CLI_GIT ]; then
    git add $outfile.gz
    git commit -m "backup - $timestamp"
    git push
fi

popd >/dev/null
