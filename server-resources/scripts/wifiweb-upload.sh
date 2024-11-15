#!/bin/bash

ROOT_DIR=$1
USR=`logname`

if [ -f /home/$USR/.ssh/id_rsa ]; then
  ADDITIONAL_CMD="-i /home/$USR/.ssh/id_rsa"
else
  ADDITIONAL_CMD=""
fi

EXCLUDE=(
    "node_modules"
    "build"
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

rsync -razulqP --delete $EXCLUSION_PARAMS --rsh="/usr/bin/sshpass -P passphrase -p \"$WIFIWEB_UPLOAD_PASSWORD\" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME" $ROOT_DIR/wifiweb $WIFIWEB_UPLOAD_HOST:"$WIFIWEB_UPLOAD_DIR"
