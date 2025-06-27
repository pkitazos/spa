#!/usr/bin/env bash

if [[ -z $1 ]]; then
    echo "You must specify which emails should be notified on amps system events"
    echo "Please give these as a comma separated list"
    read -p "** " devEmails
else
    devEmails = "$1"
fi

prev_env=$(cat /etc/environment | grep -v "AMPS_DEV_EMAILS")

(
    echo "$prev_env"
    echo "AMPS_DEV_EMAILS='$devEmails'"
) |
    sudo tee /etc/environment >/dev/null
