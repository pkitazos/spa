#!/usr/bin/env bash

if [ ! -z $1 ]; then
    AMPS_DEPLOYMENT_MODE = $1
elif [ -z $AMPS_DEPLOYMENT_MODE ]; then
    echo "What mode do you wish to deploy AMPS in? This may be staging or prod"
    read -p "** " AMPS_DEPLOYMENT_MODE
else
    echo "The AMPS is currently deployed in '$AMPS_DEPLOYMENT_MODE'."
    read -n 1 -p "Would you like to change this? [y/N] " changeMode
    echo ""
    if [[ $changeMode == [yY] ]]; then
        echo "What mode do you wish to deploy AMPS in? This may be staging or prod"
        read -p "** " AMPS_DEPLOYMENT_MODE
    fi
fi

# Check deployment mode is properly set
if [[ ! "staging prod" =~ (^|[[:space:]])"$AMPS_DEPLOYMENT_MODE"($|[[:space:]]) ]]; then
    echo "Deployment mode must be either 'staging' or 'prod'"
    exit 1
fi

# Set system-wide environment variable so future scripts can find the right place
prevEnv=$(cat /etc/environment | grep -v "AMPS_LOC" | grep -v "AMPS_DEPLOYMENT_MODE")

# Navigate to repo root
pushd ../../.. >/dev/null

(
    echo "$prevEnv"
    echo "AMPS_LOC=\"$(pwd)\""
    echo "AMPS_DEPLOYMENT_MODE=\"$AMPS_DEPLOYMENT_MODE\""
) |
    sudo tee /etc/environment >/dev/null

popd >/dev/null

# Link the amps CLI
sudo ln -sf $AMPS_LOC/scripts/deploy/amps \
    /usr/local/bin/amps

# Automatic restart service
read -n 1 -p "Do you wish to configure the AMPS startup service? [Y/n] " startupCheck
echo ""
if [[ ! $startupCheck == [nN] ]]; then
    ./config/startup-service.sh
fi

# Configure automatic updater
read -n 1 -p "Do you wish to configure automatic updates? [Y/n] " updaterCheck
echo ""
if [[ ! $updaterCheck == [nN] ]]; then
    ./config/updater.sh
fi

# Emails
read -n 1 -p "Do you wish to configure email notifications? [Y/n] " emails_check
echo ""
if [[ ! $emails_check == [nN] ]]; then
    ./config/email.sh
fi

if [[ "$AMPS_DEPLOYMENT_MODE" == "prod" ]]; then
    # Database backups
    read -n 1 -p "Do you wish to configure automatic db backups? [Y/n] " db_backups_check
    echo ""
    if [[ ! $db_backups_check == [nN] ]]; then
        ./config/db-backups.sh
    fi

    # Log backups
    read -n 1 -p "Do you wish to configure automatic log backups? [Y/n] " log_backups_check
    echo ""
    if [[ ! $log_backups_check == [nN] ]]; then
        ./config/log-backups.sh
    fi

else # if in staging...
    # Database backups
    read -n 1 -p "Do you wish to configure automatic db backups? [y/N]" db_backups_check
    echo ""
    if [[ $db_backups_check == [yY] ]]; then
        ./config/db-backups.sh
    fi

    # Log backups
    read -n 1 -p "Do you wish to configure automatic log backups? [y/N]" log_backups_check
    echo ""
    if [[ $log_backups_check == [yY] ]]; then
        ./config/log-backups.sh
    fi

fi

echo "AMPS setup complete."
echo "You will need to logout for environment variable changes to take effect."
