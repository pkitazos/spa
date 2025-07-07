#!/usr/bin/env bash

# App auto updater:
default_updater="2"
if [[ "$AMPS_DEPLOYMENT_MODE" == "prod" ]]; then
    default_updater="1"
fi

echo "Would you like to configure amps to stay up to date? the options are:"
echo "  0) no updater"
echo "  1) daily                * default for prod"
echo "  2) with webhook         * default for staging"
read -n 1 -p "choice: " auto_updater_choice
echo ""

auto_updater_choice=${auto_updater_choice:-$default_updater}

if [[ $auto_updater_choice == "1" ]]; then
    # For prod, add pull to crontab
    cron_job="0 3 * * * amps pull"
    prev_cron=$(sudo crontab -u root -l | grep -v "amps pull")
    (
        echo "$cron_job"
        echo "$prev_cron"
    ) | sudo crontab -u root -
elif [[ $auto_updater_choice == "2" ]]; then
    # For staging, setup webhook
    # TODO
    echo "Sorry! not yet implemented!"
fi
