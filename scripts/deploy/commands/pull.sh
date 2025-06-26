#!/usr/bin/bash

pushd $AMPS_LOC

docker compose --env-file=./.env -f "./docker/docker-compose.$AMPS_DEP_MODE.yml" pull
docker compose --env-file=./.env -f "./docker/docker-compose.$AMPS_DEP_MODE.yml" up -d

docker image prune -f

if [ ! -z $AMPS_CLI_EMAIL ]; then
    if [ -z $AMPS_DEV_EMAILS ]; then
        echo "Dev emails not specified"
        exit 1
    fi
    echo "Pulled and restarted $AMPS_DEP_MODE" |
        mutt -s "AMPS $AMPS_DEP_MODE: pulled" "$AMPS_DEV_EMAILS"
fi

popd
