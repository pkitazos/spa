# If this is run 2, check the user wants to change the settings
if [ ! -z $AMPS_DB_BACKUP_DIR ]; then
    echo "The AMPS_DB_BACKUP_DIR is currently set to '$AMPS_DB_BACKUP_DIR'"
    read -n 1 -p "Do you want to re-configure this? [y/N]" reconfigure
    echo ""

    if [[ ! $reconfigure == [yY] ]]; then
        exit 0
    fi
fi

# Does the user even want backups?
read -n 1 -p "Do you wish to enable off-site backups for the db? [Y/n]" enable
echo ""

# Grab the old env var contents
prevEnv=$(cat /etc/environment | grep -v "AMPS_DB_BACKUP_DIR")

# If disabled, we need to write back the envs, without the AMPS_DB_BACKUP_DIR variable set
if [[ enable == [nN] ]]; then
    echo $prevEnv | sudo tee /etc/environment >/dev/null
    echo "DB backups disabled"
    exit 0
fi

# Get relevant info from user
echo "Please enter the URL of the git repo you want to use to store the db backups."
read -p "** " remoteUrl

echo "Where (locally, on disk) should we keep this repository?"
echo "Default: [/var/amps/db-images]"
read -p "** " backupDir

# With the default...
backupDir=${backupDir:-'/var/amps/db-images'}

sudo mkdir -p $backupDir
pushd $backupDir >/dev/null

sudo git clone $remoteUrl .

(
    echo "$prevEnv"
    echo "AMPS_DB_BACKUP_DIR='$(pwd)'"
) |
    sudo tee /etc/environment >/dev/null

cronJob="*/10 * * * * /usr/local/bin/amps db backup -g"
prevCron=$(sudo crontab -u root -l | grep -v "amps db backup -g")
(
    echo "$cronJob"
    echo "$prevCron"
) | sudo crontab -u root -

echo "DB Backups enabled; images will be taken hourly"

popd >/dev/null
