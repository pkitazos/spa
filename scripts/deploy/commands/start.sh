#!/usr/bin/env bash

pushd $AMPS_LOC >/dev/null

sudo docker compose --env-file=./.env -f "./docker/docker-compose.$AMPS_DEPLOYMENT_MODE.yml" up -d

if [ ! -z $AMPS_CLI_EMAIL ]; then
    if [ -z $AMPS_DEV_EMAILS ]; then
        echo "Dev emails not specified"
        exit 1
    fi
    echo "Started $AMPS_DEPLOYMENT_MODE" |
        mutt -s "AMPS $AMPS_DEPLOYMENT_MODE: started" "$AMPS_DEV_EMAILS"
fi

popd >/dev/null
