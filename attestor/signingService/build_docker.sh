#/bin/bash

cd ..
export DIR=$(pwd)
docker build -f $DIR/signingService/Dockerfile -t signingservice $DIR

docker compose -f $DIR/signingService/compose.yaml up -d