#!/bin/bash

amps_image_id=$(docker image list | awk '$1 == "amps" && $2 == "latest" {print $3}')

if [ -n "$amps_image_id" ]; then
    echo "Found amps image with ID: $amps_image_id"
    docker stop amps-app-1
    docker rmi -f $amps_image_id
    docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.override.yml up -d
else
    echo "No amps image found"
fi
