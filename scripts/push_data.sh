#!/bin/bash

pushd src/db/migrations
scp data.t.zip ssh1:.
ssh -t ssh1 "scp data.t.zip gussdev@carlos.dcs.gla.ac.uk:."
popd