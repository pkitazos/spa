#!/usr/bin/env bash

read -n 1 -p "Do you wish to enable the startup service? [Y/n]" startupEnable
echo ""

if [[ $startupEnable == [nN] ]]; then
    enabled=$(sudo systemctl is-enabled amps-startup.service)
    if [[ $enabled == "enabled" ]]; then
        sudo systemctl disable amps-startup.service
    fi
    sudo rm -f /etc/systemd/system/amps-startup.service
else
    # Link the service description file
    sudo ln -sf ~/spa/scripts/deploy/amps-startup.service \
        /etc/systemd/system/amps-startup.service

    # And start the service
    sudo systemctl enable amps-startup.service
fi
