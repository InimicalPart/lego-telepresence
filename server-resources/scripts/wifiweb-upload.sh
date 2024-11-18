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

#! Clean up the "build" folder in $SCRIPT_DIR/../wifiweb locally
echo "[WIFIWEB] Cleaning up the build folder in $ROOT_DIR/wifiweb"
rm -rf $ROOT_DIR/wifiweb/build
echo "[WIFIWEB] Cleaned up the build folder in $ROOT_DIR/wifiweb"

#! Download all dependencies for the project in $SCRIPT_DIR/../wifiweb locally
echo "[WIFIWEB] Downloading all dependencies for the project in $ROOT_DIR/wifiweb"
sudo -u $USR bash -i -c "npm --prefix $ROOT_DIR/wifiweb i"
echo "[WIFIWEB] Downloaded all dependencies for the project in $ROOT_DIR/wifiweb"

#! Build the project in $SCRIPT_DIR/../wifiweb locally
echo "[WIFIWEB] Building the project in $ROOT_DIR/wifiweb"
sudo -u $USR bash -i -c "npm --prefix $ROOT_DIR/wifiweb run build"
echo "[WIFIWEB] Built the project in $ROOT_DIR/wifiweb"

echo "[WIFIWEB] Uploading WiFiWeb on $WIFIWEB_UPLOAD_HOST"
rsync -razulqP --delete $EXCLUSION_PARAMS --rsh="/usr/bin/sshpass -P passphrase -p \"$WIFIWEB_UPLOAD_PASSWORD\" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME" $ROOT_DIR/wifiweb $WIFIWEB_UPLOAD_HOST:"$WIFIWEB_UPLOAD_DIR"
echo "[WIFIWEB] Uploaded WiFiWeb to $WIFIWEB_UPLOAD_DIR on $WIFIWEB_UPLOAD_HOST"