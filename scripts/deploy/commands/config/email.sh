#!/usr/bin/env bash

if [ ! -z $AMPS_DEV_EMAILS ]; then
    echo "The AMPS dev emails are currently set to:"
    echo $AMPS_DEV_EMAILS
    read -n 1 -p "Do you wish to change this? [y/N]" changeEmail
    echo ""

    if [[ ! $changeEmail == [yY] ]]; then
        exit 0
    fi
fi

read -n 1 -p "Do you wish to enable email? [Y/n]" setEmails
echo ""

prevEnv=$(cat /etc/environment | grep -v "AMPS_DEV_EMAILS" | grep -v "AMPS_CLI_EMAIL")

if [[ $setEmails == [nN] ]]; then
    echo $prevEnv | sudo tee /etc/environment >/dev/null
    exit 0
fi

if [ -z $1 ]; then
    echo "You must specify which emails should be notified on amps system events"
    echo "Please give these as a comma separated list"
    read -p "** " devEmails
else
    devEmails = "$1"
fi

(
    echo "$prevEnv"
    echo "AMPS_CLI_EMAIL=true"
    echo "AMPS_DEV_EMAILS='$devEmails'"
) |
    sudo tee /etc/environment >/dev/null
