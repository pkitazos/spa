if [[ ! -z $1 ]]; then
    backupDir = "$1"
elif [[! -z $AMPS_DB_BACKUP_DIR ]]; then
    echo "The backup directory is currently set to '$AMPS_DB_BACKUP_DIR'"
    read -n 1 -p "Would you like to change it? [Y/n]" update
    if [[ $update == [nN] ]]; then
        exit 0
    else
        echo "Which directory are the backups stored in?"
        read -p "** " backupDir
    fi
else
    echo "Which directory are the backups stored in?"
    read -p "** " backupDir
fi

mkdir -p "$backupDir"

pushd "$backupDir"

backupDir=$(pwd) # Normalise the path

echo "Setting up AMPS db backups in '$backupDir'"

# Ensure that the directory is a repository
if git status; then
    echo "This directory does not appear to be a git repo."
    read -n 1 -p "Should we set one up? [Y/n] " setup

    if [[ ! $setup == [nN] ]]; then
        git init
        git config user.name "SPA System"
        git config user.email "compsci-spa-support@glasgow.ac.uk"
    fi
fi

prevEnv=$(cat /etc/environment | grep -v "AMPS_DB_BACKUP_DIR")

(
    echo "$prevEnv"
    echo "AMPS_DB_BACKUP_DIR=$backupDir"
) |
    sudo tee /etc/environment >/dev/null

popd
