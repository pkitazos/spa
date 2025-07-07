#!/usr/bin/env bash

pushd $AMPS_LOC >/dev/null

docker compose --env-file=./.env -f "./docker/docker-compose.$AMPS_DEPLOYMENT_MODE.yml" down

popd >/dev/null
