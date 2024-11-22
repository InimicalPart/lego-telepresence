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
    "config-dev.jsonc"
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

#! Clean up the "dist" folder in $ROOT_DIR/cam-client locally
echo "[CAM-CLIENT] Cleaning up the dist folder in $ROOT_DIR/cam-client"
rm -rf $ROOT_DIR/cam-client/dist

#! Download all dependencies for the project in $ROOT_DIR/cam-client locally
echo "[CAM-CLIENT] Downloading all dependencies for the project in $ROOT_DIR/cam-client"
sudo -u $USR bash -i -c "npm --prefix $ROOT_DIR/cam-client i > /dev/null"

#! Build the project in $ROOT_DIR/cam-client locally
echo "[CAM-CLIENT] Building the project in $ROOT_DIR/cam-client"
sudo -u $USR bash -i -c "npm --prefix $ROOT_DIR/cam-client run build > /dev/null"

echo "[CAM-CLIENT] Uploading cam-client on $CAM_CLIENT_UPLOAD_HOST"
rsync -razulqP --delete $EXCLUSION_PARAMS --rsh="/usr/bin/sshpass -P passphrase -p \"$CAM_CLIENT_UPLOAD_PASSWORD\" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME" $ROOT_DIR/cam-client $CAM_CLIENT_UPLOAD_HOST:"$CAM_CLIENT_UPLOAD_DIR"