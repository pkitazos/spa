#!/usr/bin/env bash

pushd $AMPS_LOG_BACKUP_DIR >/dev/null

timestamp=$(date --iso-8601=seconds)
outfile=all-logs-$timestamp.tgz

mkdir -p temp

docker cp amps-app-1:/app/logs/. temp

tar -ca -f "$outfile" --force-local -- ./temp/*

rm -r temp

if [ ! -z $AMPS_CLI_GIT ]; then
    git add $outfile
    git commit -m "backup - $timestamp"
    git push
fi

popd >/dev/null
