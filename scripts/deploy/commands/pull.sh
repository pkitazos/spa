#!/usr/bin/bash

pushd $AMPS_LOC

docker compose --env-file=./.env -f "./docker/docker-compose.$AMPS_DEP_MODE.yml" pull
docker compose --env-file=./.env -f "./docker/docker-compose.$AMPS_DEP_MODE.yml" up -d

docker image prune -f

popd