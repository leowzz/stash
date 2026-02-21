#!/bin/bash

REGISTRY="registry.cn-heyuan.aliyuncs.com"
NAMESPACE="leo03w"
DOCKER_TAGS=""

for TAG in "$@"
do
	DOCKER_TAGS="$DOCKER_TAGS -t $REGISTRY/$NAMESPACE/stash:$TAG"
done

echo "$DOCKER_PASSWORD" | docker login -u "leo03w" "$REGISTRY" --password-stdin

# must build the image from dist directory
docker buildx build --platform linux/amd64 --push $DOCKER_TAGS -f docker/ci/x86_64/Dockerfile dist/
