#!/bin/bash

ROOT_DIR=$1
USR=`logname`

if [ -f /home/$USR/.ssh/id_rsa ]; then
  ADDITIONAL_CMD="-i /home/$USR/.ssh/id_rsa"
else
  ADDITIONAL_CMD=""
fi

EXCLUDE=(
    ".history"
    "package-lock.json"
)

#* vv Credit https://stackoverflow.com/a/17841619
function join_by {
  local d=${1-} f=${2-}
  if shift 2; then
    printf %s "$f" "${@/#/$d}"
  fi
}
#* ^^ Credit https://stackoverflow.com/a/17841619

EXCLUSION_PARAMS="--exclude=$(join_by " --exclude=" ${EXCLUDE[@]})"

#! Clean up the "build" folder in $ROOT_DIR/main locally
echo "[MAIN] Cleaning up the build folder in $ROOT_DIR/main"
rm -rf $ROOT_DIR/main/build

#! Download all dependencies for the project in $ROOT_DIR/main locally
echo "[MAIN] Downloading all dependencies for the project in $ROOT_DIR/main"
sudo -u $USR bash -i -c "npm --prefix $ROOT_DIR/main i > /dev/null"

PREVIOUS_DIR=$(pwd)
cd $ROOT_DIR/main

#! Adding next-ws
echo "[MAIN] Patching NextJS with next-ws"
sudo -u $USR bash -i -c "npx -y --yes next-ws-cli@latest patch -y --yes > /dev/null 2>&1"

cd $PREVIOUS_DIR

#! Build the project in $ROOT_DIR/main locally
echo "[MAIN] Building the project in $ROOT_DIR/main"
sudo -u $USR bash -i -c "npm --prefix $ROOT_DIR/main run build > /dev/null"

echo "[MAIN] Uploading Main on $MAIN_UPLOAD_HOST"
rsync -razulqP --delete $EXCLUSION_PARAMS --rsh="/usr/bin/sshpass -P passphrase -p \"$MAIN_UPLOAD_PASSWORD\" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME" $ROOT_DIR/main $MAIN_UPLOAD_HOST:"$MAIN_UPLOAD_DIR"