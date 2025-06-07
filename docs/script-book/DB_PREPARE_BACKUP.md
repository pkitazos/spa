# How to Prepare a Production Backup for Transfer

This guide documents the process for finding the latest database backup on the server and preparing it for secure transfer to a local machine.

**Prerequisites:**

- You are logged into the server via SSH.
- The `prepare_backup.sh` script is located in the `spa` directory.
- The `spa-backups/backups/` directory exists and contains one or more `.gz` backup files.
- The `prepare_backup.sh` script has been made executable (`chmod +x prepare_backup.sh`).

---

### Step 1: Run the Preparation Script

Navigate to the `spa` directory and execute the `prepare_backup.sh` script. This script will automatically find the newest backup file, copy it to a temporary location, and rename it.

```bash
./prepare_backup.sh
```

---

### Step 2: Verify the Output

A successful run will produce output confirming the process. The last line will indicate that the backup is ready at `/tmp/backup.gz`.

**Example output:**

```
Starting backup preparation on server...
   - Searching for the latest backup in '../spa-backups/backups'...
   - Found latest backup: '2025-06-07T18-30-01+00-00.gz'
   - Copying '2025-06-07T18-30-01+00-00.gz' to '/tmp/backup.gz'...
Success! Latest backup prepared at '/tmp/backup.gz'.
```

---

### Step 3: Next Steps

The latest backup is now staged at `/tmp/backup.gz` on the server. The file is ready to be securely copied to your local machine using the `scp` command or the `fetch_backup.sh` script.
