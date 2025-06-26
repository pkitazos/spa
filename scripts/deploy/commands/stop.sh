#!/usr/bin/env bash

pushd $AMPS_LOC

docker compose --env-file=./.env -f "./docker/docker-compose.$AMPS_DEP_MODE.yml" down

popd
