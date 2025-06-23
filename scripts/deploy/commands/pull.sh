#!/usr/bin/bash

pushd $AMPS_LOC

docker compose --env-file=./.env -f "./docker/docker-compose.$AMPS_DEP_MODE.yml" pull
docker compose --env-file=./.env -f "./docker/docker-compose.$AMPS_DEP_MODE.yml" up -d

docker image prune -f

if [[ $1 == 'email' ]]; then
    if [ -z $AMPS_DEV_EMAILS ]; then
        echo "Pulled and restarted $AMPS_DEP_MODE" | mutt -s "AMPS $AMPS_DEP_MODE: pulled" "$AMPS_DEV_EMAILS"
    else 
        echo "Dev emails not set"
    fi
fi

popd