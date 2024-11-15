#!/usr/bin/env bash

if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi


#? vv Credit: https://stackoverflow.com/a/246128
SOURCE=${BASH_SOURCE[0]}
while [ -L "$SOURCE" ]; do
  SCRIPT_DIRECTORY=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )
  SOURCE=$(readlink "$SOURCE")
  [[ $SOURCE != /* ]] && SOURCE=$SCRIPT_DIRECTORY/$SOURCE
done
SCRIPT_DIRECTORY=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )
#? ^^ Credit: https://stackoverflow.com/a/246128


if [ ! -f "$SCRIPT_DIRECTORY/secrets.sh" ]; then
  echo "Please create a secrets.sh file in the same directory as this script"
  echo "You can copy secrets.template.sh to secrets.sh and edit it"
  exit 1
fi

echo "[INIT] Loading secrets"
source "$SCRIPT_DIRECTORY/secrets.sh"
echo "[INIT] Making sure sshpass is installed"
if ! command -v sshpass &> /dev/null
then
    echo "[INIT] sshpass could not be found, installing it"
    sudo apt-get install sshpass -y
    if [ $? -ne 0 ]; then
      echo "[INIT] Failed to install sshpass"
      exit 1
    fi
fi

echo $SCRIPT_DIRECTORY
ROOT_DIR=`readlink -f "$SCRIPT_DIRECTORY/../"`
echo "[WIFIWEB] Uploading WiFiWeb on $WIFIWEB_UPLOAD_HOST"
source "$SCRIPT_DIRECTORY/scripts/wifiweb-upload.sh" $ROOT_DIR
echo "[WIFIWEB] Uploaded WiFiWeb to $WIFIWEB_UPLOAD_DIR on $WIFIWEB_UPLOAD_HOST"
source "$SCRIPT_DIRECTORY/scripts/wifiweb-setup.sh" $SCRIPT_DIRECTORY







