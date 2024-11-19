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

#! Clean up the "dist" folder in $ROOT_DIR/car-client locally
echo "[CAR-CLIENT] Cleaning up the dist folder in $ROOT_DIR/car-client"
rm -rf $ROOT_DIR/car-client/dist

#! Download all dependencies for the project in $ROOT_DIR/car-client locally
echo "[CAR-CLIENT] Downloading all dependencies for the project in $ROOT_DIR/car-client"
sudo -u $USR bash -i -c "npm --prefix $ROOT_DIR/car-client i > /dev/null"

#! Build the project in $ROOT_DIR/car-client locally
echo "[CAR-CLIENT] Building the project in $ROOT_DIR/car-client"
sudo -u $USR bash -i -c "npm --prefix $ROOT_DIR/car-client run build > /dev/null"

echo "[CAR-CLIENT] Uploading car-client on $CAR_CLIENT_UPLOAD_HOST"
rsync -razulqP --delete $EXCLUSION_PARAMS --rsh="/usr/bin/sshpass -P passphrase -p \"$CAR_CLIENT_UPLOAD_PASSWORD\" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME" $ROOT_DIR/car-client $CAR_CLIENT_UPLOAD_HOST:"$CAR_CLIENT_UPLOAD_DIR"