#!/usr/bin/bash

pushd $AMPS_LOC

docker compose --env-file=./.env -f "./docker/docker-compose.$AMPS_DEP_MODE.yml" up -d

if [ ! -z $AMPS_CLI_EMAIL ]; then
    if [ -z $AMPS_DEV_EMAILS ]; then
        echo "Dev emails not specified"
        exit 1
    fi
    echo "Started $AMPS_DEP_MODE" |
        mutt -s "AMPS $AMPS_DEP_MODE: started" "$AMPS_DEV_EMAILS"
fi

popd
