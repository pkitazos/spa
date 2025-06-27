#!/usr/bin/env bash

# Link the service description file
sudo ln -sf ~/spa/scripts/deploy/amps-startup.service \
    /etc/systemd/system/amps-startup.service

# And start the service
sudo systemctl enable amps-startup.service
