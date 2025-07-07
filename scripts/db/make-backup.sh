#!/bin/bash

USER=root
HOST=db
PORT=5432
PASSWORD=1234
DBNAME="amps-db"

while true ; do
	OUTFILE="./backups/$(date --iso-8601=seconds)"
	pg_dump -d ${DBNAME} -h ${HOST} -p ${PORT} -U ${USER} > ${OUTFILE}
	gzip ${OUTFILE}
	sleep 1h
done