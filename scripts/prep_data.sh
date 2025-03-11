#!/bin/bash

pushd src/db/migrations
rm data.t.zip
zip -r data.t.zip data
zip -d data.t.zip data/.DS_Store
popd