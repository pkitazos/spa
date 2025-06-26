#!/usr/bin/env bash

pushd $AMPS_BACKUP_DIR

outfile=db-image-$(date --iso-8601=seconds).sql

docker exec amps-db-1 pg_dump -d ${DB_NAME} >$outfile

gzip $outfile

if [ ! -z $AMPS_CLI_GIT ]; then
    git add $outfile
    git commit -m "backup - $timestamp"
    git push
fi

popd
