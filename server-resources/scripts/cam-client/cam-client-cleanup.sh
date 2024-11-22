#!/bin/bash

SCRIPT_DIR=$1
USR=`logname`

if [ -f /home/$USR/.ssh/id_rsa ]; then
  ADDITIONAL_CMD="-i /home/$USR/.ssh/id_rsa"
else
  ADDITIONAL_CMD=""
fi


#! Check if the cam-client service exists
CAM_CLIENT_EXISTS=`sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl status cam-client >/dev/null 2>&1; echo \\\$?"`

if [ "$CAM_CLIENT_EXISTS" -eq 0 ]; then
    echo "[CAM-CLIENT] Cam Client service exists on $CAM_CLIENT_UPLOAD_HOST"
else
    echo "[CAM-CLIENT] Cam Client service does not exist on $CAM_CLIENT_UPLOAD_HOST"
fi

if [ "$CAM_CLIENT_EXISTS" -eq 0 ]; then
    #! Stop the cam-client service
    echo "[CAM-CLIENT] Stopping the cam-client service on $CAM_CLIENT_UPLOAD_HOST"
    sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl disable cam-client --now > /dev/null 2>&1"
fi

#! Copy over $SD/sudoers/cam-client-access to /etc/sudoers.d/cam-client-access on $CAM_CLIENT_UPLOAD_HOST as sudo
echo "[CAM-CLIENT] Removing sudoers file from $CAM_CLIENT_UPLOAD_HOST"
SUDOERS_CONTENT=`cat $SCRIPT_DIR/sudoers/cam-client-access | base64`
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S sh -c 'rm -rf /etc/sudoers.d/cam-client-access' > /dev/null 2>&1"

#! Copy over $SCRIPT_DIR/services/cam-client.service to /etc/systemd/system/cam-client.service on $CAM_CLIENT_UPLOAD_HOST as sudo and symlink it to /lib/systemd/system/cam-client.service
echo "[CAM-CLIENT] Removing systemd service file from $CAM_CLIENT_UPLOAD_HOST"
SYSTEMD_CONTENT=`cat $SCRIPT_DIR/services/cam-client.service | base64`
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S sh -c 'rm -rf /etc/systemd/system/cam-client.service && rm -rf /lib/systemd/system/cam-client.service' > /dev/null 2>&1"

#! Reload systemd on $CAM_CLIENT_UPLOAD_HOST as sudo
echo "[CAM-CLIENT] Reloading systemd on $CAM_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl daemon-reload > /dev/null 2>&1"

#! Remove any left-overs in $CAM_CLIENT_FINAL_DIR on $CAM_CLIENT_UPLOAD_HOST as sudo
echo "[CAM-CLIENT] Removing left-overs in $CAM_CLIENT_FINAL_DIR/cam-client on $CAM_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S rm -rf $CAM_CLIENT_FINAL_DIR/cam-client > /dev/null 2>&1"

#! Remove any left-overs in $CAM_CLIENT_UPLOAD_DIR on $CAM_CLIENT_UPLOAD_HOST as sudo
echo "[CAM-CLIENT] Removing left-overs in $CAM_CLIENT_UPLOAD_DIR/cam-client on $CAM_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S rm -rf $CAM_CLIENT_UPLOAD_DIR/cam-client > /dev/null 2>&1"

#! Revoke permissions to connect to bluetooth devices for $CAM_CLIENT_GIVE_RIGHTS_TO
echo "[CAM-CLIENT] Revoking permissions to connect to bluetooth devices for "$CAM_CLIENT_GIVE_RIGHTS_TO" on $CAM_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S rm -rf /etc/dbus-1/system.d/node-ble-cam.conf > /dev/null 2>&1"
