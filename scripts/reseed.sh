#!/bin/bash

pushd ~/spa
export DATABASE_URL="postgresql://root:1234@localhost:6565/amps-db" 
pnpm prisma migrate reset
pnpm prisma db push
pnpm tsx src/db/seed.ts
popd