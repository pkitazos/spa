pushd ~/spa

docker build -f docker/Dockerfile . 
scripts/restart_prod.sh

popd
