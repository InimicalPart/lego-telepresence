#!/bin/bash

SCRIPT_DIR=$1
USR=`logname`

if [ -f /home/$USR/.ssh/id_rsa ]; then
  ADDITIONAL_CMD="-i /home/$USR/.ssh/id_rsa"
else
  ADDITIONAL_CMD=""
fi


#! Check if the car-client service exists
CAR-CLIENT_EXISTS=`sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl status car-client >/dev/null 2>&1; echo \\\$?"`

if [ "$CAR_CLIENT_EXISTS" -eq 0 ]; then
    echo "[CAR-CLIENT] Car Client service exists on $CAR_CLIENT_UPLOAD_HOST"
else
    echo "[CAR-CLIENT] Car Client service does not exist on $CAR_CLIENT_UPLOAD_HOST"
fi

if [ "$CAR_CLIENT_EXISTS" -eq 0 ]; then
    #! Stop the car-client service
    echo "[CAR-CLIENT] Stopping the car-client service on $CAR_CLIENT_UPLOAD_HOST"
    sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl disable car-client --now > /dev/null 2>&1"
fi

#! Copy over $SD/sudoers/car-client-access to /etc/sudoers.d/car-client-access on $CAR_CLIENT_UPLOAD_HOST as sudo
echo "[CAR-CLIENT] Removing sudoers file from $CAR_CLIENT_UPLOAD_HOST"
SUDOERS_CONTENT=`cat $SCRIPT_DIR/sudoers/car-client-access | base64`
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S sh -c 'rm -rf /etc/sudoers.d/car-client-access > /dev/null 2>&1"

#! Copy over $SCRIPT_DIR/services/car-client.service to /etc/systemd/system/car-client.service on $CAR_CLIENT_UPLOAD_HOST as sudo and symlink it to /lib/systemd/system/car-client.service
echo "[CAR-CLIENT] Removing systemd service file from $CAR_CLIENT_UPLOAD_HOST"
SYSTEMD_CONTENT=`cat $SCRIPT_DIR/services/car-client.service | base64`
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S sh -c 'rm -rf /etc/systemd/system/car-client.service && rm -rf /lib/systemd/system/car-client.service' > /dev/null 2>&1"

#! Reload systemd on $CAR_CLIENT_UPLOAD_HOST as sudo
echo "[CAR-CLIENT] Reloading systemd on $CAR_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl daemon-reload > /dev/null 2>&1"

#! Remove any left-overs in $CAR_CLIENT_FINAL_DIR on $CAR_CLIENT_UPLOAD_HOST as sudo
echo "[CAR-CLIENT] Removing left-overs in $CAR_CLIENT_FINAL_DIR/car-client on $CAR_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S rm -rf $CAR_CLIENT_FINAL_DIR/car-client > /dev/null 2>&1"

#! Remove any left-overs in $CAR_CLIENT_UPLOAD_DIR on $CAR_CLIENT_UPLOAD_HOST as sudo
echo "[CAR-CLIENT] Removing left-overs in $CAR_CLIENT_UPLOAD_DIR/car-client on $CAR_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S rm -rf $CAR_CLIENT_UPLOAD_DIR/car-client > /dev/null 2>&1"

#! Revoke permissions to connect to bluetooth devices for $CAR_CLIENT_GIVE_RIGHTS_TO
echo "[CAR-CLIENT] Revoking permissions to connect to bluetooth devices for "$CAR_CLIENT_GIVE_RIGHTS_TO" on $CAR_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S rm -rf /etc/dbus-1/system.d/node-ble-car.conf > /dev/null 2>&1"
