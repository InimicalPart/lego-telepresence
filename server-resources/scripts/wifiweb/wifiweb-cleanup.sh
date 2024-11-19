#!/bin/bash

SCRIPT_DIR=$1
USR=`logname`

if [ -f /home/$USR/.ssh/id_rsa ]; then
  ADDITIONAL_CMD="-i /home/$USR/.ssh/id_rsa"
else
  ADDITIONAL_CMD=""
fi


#! Check if the wifiweb service exists
WIFIWEB_EXISTS=`sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S systemctl status wifiweb >/dev/null 2>&1; echo \\\$?"`

if [ "$WIFIWEB_EXISTS" -eq 0 ]; then
    echo "[WIFIWEB] WiFiWeb service exists on $WIFIWEB_UPLOAD_HOST"
else
    echo "[WIFIWEB] WiFiWeb service does not exist on $WIFIWEB_UPLOAD_HOST"
fi

if [ "$WIFIWEB_EXISTS" -eq 0 ]; then
    #! Stop the wifiweb service
    echo "[WIFIWEB] Stopping the wifiweb service on $WIFIWEB_UPLOAD_HOST"
    sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S systemctl disable wifiweb --now > /dev/null 2>&1"
fi

#! Remove /etc/sudoers.d/wifiweb-access on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Removing sudoers file from $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S sh -c 'rm -rf /etc/sudoers.d/wifiweb-access' > /dev/null 2>&1"

#! Remove /etc/systemd/system/wifiweb.service on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Removing systemd service file from $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S sh -c 'rm -rf /etc/systemd/system/wifiweb.service && rm -rf /lib/systemd/system/wifiweb.service' > /dev/null 2>&1"

#! Reload systemd on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Reloading systemd on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S systemctl daemon-reload > /dev/null 2>&1"

#! Remove any left-overs from $WIFIWEB_FINAL_DIR on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Removing any left-overs from $WIFIWEB_FINAL_DIR/wifiweb on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S rm -rf $WIFIWEB_FINAL_DIR/wifiweb > /dev/null 2>&1"

#! Remove WiFiWeb from $WIFIWEB_UPLOAD_DIR on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Removing WiFiWeb from $WIFIWEB_UPLOAD_DIR/wifiweb on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S rm -rf $WIFIWEB_UPLOAD_DIR/wifiweb > /dev/null 2>&1"

#! Revoke permissions to listen on port 80 and 443 for non-root users
echo "[WIFIWEB] Revoking permissions to listen on port 80 and 443 for non-root users on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S setcap CAP_NET_BIND_SERVICE=-eip \$(which node) > /dev/null 2>&1"