#!/usr/bin/env bash

if [ ! -z $1 ]; then
    AMPS_DEPLOYMENT_MODE = $1
elif [ -z $AMPS_DEPLOYMENT_MODE ]; then
    echo "What mode do you wish to deploy AMPS in? This may be staging or prod"
    read -p "** " AMPS_DEPLOYMENT_MODE
fi

# Check deployment mode is properly set
if [[ ! "staging prod" =~ (^|[[:space:]])"$AMPS_DEPLOYMENT_MODE"($|[[:space:]]) ]]; then
    echo "Deployment mode must be either 'staging' or 'prod'"
    exit 1
fi

# Set system-wide environment variable so future scripts can find the right place
prevEnv=$(cat /etc/environment | grep -v "AMPS_LOC" | grep -v "AMPS_DEPLOYMENT_MODE")

# Navigate to repo root
pushd ../../..

(
    echo "$prevEnv"
    echo "AMPS_LOC=\"$(pwd)\""
    echo "AMPS_DEPLOYMENT_MODE=\"$AMPS_DEPLOYMENT_MODE\""
) |
    sudo tee /etc/environment >/dev/null

popd

# Link the amps CLI
sudo ln -sf ~/spa/scripts/deploy/amps \
    /usr/local/bin/amps

# Automatic restart service
read -n 1 -p "Do you wish to add a service to start AMPS automatically? [Y/n]" startupCheck
if [[ ! $startupCheck == [nN] ]]; then
    ./install/startup-service.sh
fi

# Configure automatic updater
read -n 1 -p "Do you wish to configure automatic updates? [Y/n]" updaterCheck
if [[ ! $updaterCheck == [nN] ]]; then
    ./install/updater.sh
fi

# Emails
read -n 1 -p "Do you wish to set up email notifications? [Y/n]" emails_check
if [[ ! $emails_check == [nN] ]]; then
    ./install/emails.sh
fi

if [[ "$AMPS_DEPLOYMENT_MODE" == "prod" ]]; then
    # Database backups
    read -n 1 -p "Do you wish to set up automatic db backups? [Y/n]" db_backups_check
    if [[ ! $db_backups_check == [nN] ]]; then
        ./install/db-backups.sh
    fi

    # Log backups
    read -n 1 -p "Do you wish to set up automatic log backups? [Y/n]" log_backups_check
    if [[ ! $log_backups_check == [nN] ]]; then
        ./install/log-backups.sh
    fi

else # if in staging...
    # Database backups
    read -n 1 -p "Do you wish to set up automatic db backups? [y/N]" db_backups_check
    if [[ $db_backups_check == [yY] ]]; then
        ./install/db-backups.sh
    fi

    # Log backups
    read -n 1 -p "Do you wish to set up automatic log backups? [y/N]" log_backups_check
    if [[ $log_backups_check == [yY] ]]; then
        ./install/log-backups.sh
    fi

fi
