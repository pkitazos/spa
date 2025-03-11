#!/bin/bash

pushd spa/src/db/migrations
mv ~/data.t.zip .
rm -r data
unzip data.t.zip
rm data.t.zip
popd