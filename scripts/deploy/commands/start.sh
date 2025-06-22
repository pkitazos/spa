#!/usr/bin/bash

pushd $AMPS_LOC

docker compose -f "./docker/docker-compose.$AMPS_DEP_MODE.yml" up -d

popd