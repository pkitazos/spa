

# This file is intended to be loaded into the container running the database
# it drops all current data and loads the version stored in ./db-image.sql
# This can be obtained by gunzip-ing one of the backup dumps.
# You can copy the file into the container with:
# docker cp ./db-image.sql amps-db-1:./db-image.sql
# Assuming you are in the same directory as the db-image on the host.
psql -d amps-db -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
psql -d amps-db -f ./db-image.sql