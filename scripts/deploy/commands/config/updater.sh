#!/usr/bin/env bash

# App auto updater:
default_updater="2"
if [[ "$AMPS_DEPLOYMENT_MODE" == "prod" ]]; then
    default_updater="1"
fi

echo "Would you like to configure amps to stay up to date? the options are:"
echo "  0) no updater; stays on fixed version"
echo "  1) daily                * default for prod"
echo "  2) with webhook         * default for staging"
read -n 1 -p "choice: " auto_updater_choice

auto_updater_choice=${auto_updater_choice:-$default_updater}

# For prod, add pull to crontab
if [[ $auto_updater_choice == "1" ]]; then
    cron_job="0 3 * * * 'amps pull'"
    prev_cron=$(crontab -l | grep -v "$cron_job")
    (
        echo "$cron_job"
        echo -n "$prev_cron"
    ) | crontab -
elif [[ $auto_updater_choice == "2" ]]; then
    # For staging, setup webhook
    # TODO
    echo "Sorry! not yet implemented!"
fi
