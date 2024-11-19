#!/usr/bin/env bash

if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit
fi

#? vv Credit: https://stackoverflow.com/a/246128
SOURCE=${BASH_SOURCE[0]}
while [ -L "$SOURCE" ]; do
    SERVER_RESOURCES_DIR=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )
    SOURCE=$(readlink "$SOURCE")
    [[ $SOURCE != /* ]] && SOURCE=$SERVER_RESOURCES_DIR/$SOURCE
done
SERVER_RESOURCES_DIR=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )
#? ^^ Credit: https://stackoverflow.com/a/246128

if [ ! -f "$SERVER_RESOURCES_DIR/secrets.sh" ]; then
    echo "Please create a secrets.sh file in the same directory as this script"
    echo "You can copy secrets.template.sh to secrets.sh and edit it"
    exit 1
fi

echo "[INIT] Loading secrets"
source "$SERVER_RESOURCES_DIR/secrets.sh"
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

ROOT_DIR=`readlink -f "$SERVER_RESOURCES_DIR/../"`

# Function to upload and setup wifiweb
UnS_wifiweb() {
    echo "[INIT] Running upload & setup scripts for WiFiWeb"
    source "$SERVER_RESOURCES_DIR/scripts/wifiweb/wifiweb-upload.sh" $ROOT_DIR
    source "$SERVER_RESOURCES_DIR/scripts/wifiweb/wifiweb-setup.sh" $SERVER_RESOURCES_DIR
    echo "[WIFIWEB] Done"
}

# Function to upload and setup main
UnS_main() {
    echo "[INIT] Running upload & setup scripts for Main"
    source "$SERVER_RESOURCES_DIR/scripts/main/main-upload.sh" $ROOT_DIR
    source "$SERVER_RESOURCES_DIR/scripts/main/main-setup.sh" $SERVER_RESOURCES_DIR
    echo "[MAIN] Done"
}

# Function to upload and setup car-client
UnS_car_client() {
    echo "[INIT] Running upload & setup scripts for car-client"
    source "$SERVER_RESOURCES_DIR/scripts/car-client/car-client-upload.sh" $ROOT_DIR
    source "$SERVER_RESOURCES_DIR/scripts/car-client/car-client-setup.sh" $SERVER_RESOURCES_DIR
    echo "[CAR-CLIENT] Done"
}

# Function to upload and setup cam-client
UnS_cam_client() {
    echo "[INIT] Running upload & setup scripts for cam-client"
    source "$SERVER_RESOURCES_DIR/scripts/cam-client/cam-client-upload.sh" $ROOT_DIR
    source "$SERVER_RESOURCES_DIR/scripts/cam-client/cam-client-setup.sh" $SERVER_RESOURCES_DIR
    echo "[CAM-CLIENT] Done"
}

# Check command-line arguments
if [ $# -eq 0 ]; then
    echo "[INIT] No specific components specified, uploading and setting up all"
    UnS_wifiweb
    UnS_main
    UnS_car_client
    UnS_cam_client
else
    for component in "$@"
    do
        case $component in
            wifiweb)
                UnS_wifiweb
                ;;
            main)
                UnS_main
                ;;
            car-client)
                UnS_car_client
                ;;
            cam-client)
                UnS_cam_client
                ;;
            *)
                echo "[ERROR] Unknown component: $component"
                ;;
        esac
    done
fi
