# Writing Code For the AMPS CLI

---

## Structure

Generally, deployment scripts are run by calling the main script file (just called `amps`),
along with a subcommand and any options.
Option parsing and any validation is done in the amps file.
If validation passes, then the subcommand is run.

Subcommands are written as a separate script, and placed in the `commands/` directory.
Subcommands can be nested for clarity; for instance, we have `amps db backup`
rather than `amps db-backup`. Correspondingly, `db` command scripts are stored in `commands/db/`.

## Variables

**Global variables** are used for two purposes - persisting data across runs
(such as the deployment mode or the repository location),
Or passing data between scripts (such as whether to send email notifications).

Global variables are written in SCREAMING_SNAKE_CASE, and are prefixed with `AMPS`.
So for instance, the deployment mode (staging or prod) is stored in `AMPS_DEPLOYMENT_MODE`.

A list of global variables (and their uses) is in the table below:

| Variable               | Description                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `AMPS_DEPLOYMENT_MODE` | Either `prod` or `staging`.                                                                                          |
| `AMPS_LOC`             | Holds the location (on disk) of the AMPS repository                                                                  |
| `AMPS_DB_BACKUP_DIR`   | Holds the location of the database backup directory                                                                  |
| `AMPS_LOG_BACKUP_DIR`  | Holds the location of the log backup directory                                                                       |
| `AMPS_CLI_GIT`         | Controls whether backups should be committed to git. Feature enabled when variable is non-null                       |
| `AMPS_CLI_EMAIL`       | Controls whether operations should send email notifications (if relevant). Feature enabled when variable is non-null |
| `AMPS_DEV_EMAILS`      | Holds the list of emails notifications should be sent to. Should be formatted as a comma-separated list              |

---

**Local variables** (which don't outlive their script/function/scope) should be written in camelCase.

**Functions** are always local, and are named with lower_snake_case.
