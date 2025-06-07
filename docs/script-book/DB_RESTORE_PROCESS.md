# How to Restore the Local Database from a Production Dump

This guide documents the process for completely replacing the local PostgreSQL database with a fresh dump from production.

**Prerequisites:**

- Docker is running.
- The database container is running (`docker ps` should show `amps-db-1`).
- A SQL dump file named `backup.sql` is present in the current directory.

---

### Step 1: Copy the SQL Dump into the Container

The SQL file from your local machine needs to be accessible inside the Docker container. We copy it into the `/tmp/` directory, which is a standard location for temporary files.

```bash
docker cp backup.sql amps-db-1:/tmp/backup.sql
```

---

### Step 2: Drop the Existing Database

To ensure a clean import, we must first delete the existing local database. We connect to the default postgres database to issue the DROP command.

```bash
docker exec -it amps-db-1 psql -U root -d postgres -c "DROP DATABASE IF EXISTS \"amps-db\";"
```

---

### Step 3: Create a New Empty Database

After deleting the old one, we recreate it with the same name and owner. This gives us a clean slate for the import.

```bash
docker exec -it amps-db-1 psql -U root -d postgres -c "CREATE DATABASE \"amps-db\" WITH OWNER = root;"
```

### Step 4: Import the Dump File

Finally, we run the psql command to execute the contents of the backup.sql file, which creates the schema and copies all the data into our newly created, empty database.

```bash
docker exec -it amps-db-1 psql -U root -d amps-db -f /tmp/backup.sql
```

Upon completion, the local database will be a mirror of the production dump.
