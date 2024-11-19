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

#! Copy over $SD/sudoers/wifiweb-access to /etc/sudoers.d/wifiweb-access on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Uploading sudoers file to $WIFIWEB_UPLOAD_HOST"
SUDOERS_CONTENT=`cat $SCRIPT_DIR/sudoers/wifiweb-access | base64`
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$SUDOERS_CONTENT\" | base64 -d > /etc/sudoers.d/wifiweb-access && chmod 440 /etc/sudoers.d/wifiweb-access' > /dev/null 2>&1"

#! Copy over $SCRIPT_DIR/services/wifiweb.service to /etc/systemd/system/wifiweb.service on $WIFIWEB_UPLOAD_HOST as sudo and symlink it to /lib/systemd/system/wifiweb.service
echo "[WIFIWEB] Uploading systemd service file to $WIFIWEB_UPLOAD_HOST"
SYSTEMD_CONTENT=`cat $SCRIPT_DIR/services/wifiweb.service | base64`
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$SYSTEMD_CONTENT\" | base64 -d > /etc/systemd/system/wifiweb.service && ln -s /etc/systemd/system/wifiweb.service /lib/systemd/system/wifiweb.service' > /dev/null 2>&1"

#! Reload systemd on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Reloading systemd on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S systemctl daemon-reload > /dev/null 2>&1"

#! Remove any left-overs in $WIFIWEB_FINAL_DIR on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Removing left-overs in $WIFIWEB_FINAL_DIR/wifiweb on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S rm -rf $WIFIWEB_FINAL_DIR/wifiweb > /dev/null 2>&1"

#! Move over the folder in $WIFIWEB_UPLOAD_DIR to $WIFIWEB_FINAL_DIR on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Moving files to $WIFIWEB_FINAL_DIR/wifiweb"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S mv -f $WIFIWEB_UPLOAD_DIR/wifiweb $WIFIWEB_FINAL_DIR/wifiweb > /dev/null 2>&1"

ACCOUNT_EXISTS=`sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S id \"$WIFIWEB_GIVE_RIGHTS_TO\" >/dev/null 2>&1; echo \\\$?"`

if [ "$ACCOUNT_EXISTS" -ne 0 ]; then
    #! Create an account called "$WIFIWEB_GIVE_RIGHTS_TO" on $WIFIWEB_UPLOAD_HOST
    echo "[WIFIWEB] Creating an account for $WIFIWEB_GIVE_RIGHTS_TO on $WIFIWEB_UPLOAD_HOST"
    sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S adduser --disabled-password --gecos \"\" --home \"/home/$WIFIWEB_GIVE_RIGHTS_TO\" --shell \"/sbin/nologin\" --uid \"10001\" $WIFIWEB_GIVE_RIGHTS_TO";
fi

#! Grant permissions to listen on port 80 and 443 for non-root users
echo "[WIFIWEB] Granting permissions to listen on port 80 and 443 for non-root users on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S setcap CAP_NET_BIND_SERVICE=+eip \$(which node) > /dev/null 2>&1"

#! Give ownership of $WIFIWEB_FINAL_DIR to $WIFIWEB_GIVE_RIGHTS_TO on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Giving rights to $WIFIWEB_GIVE_RIGHTS_TO on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S chown -R $WIFIWEB_GIVE_RIGHTS_TO:$WIFIWEB_GIVE_RIGHTS_TO \"$WIFIWEB_FINAL_DIR/wifiweb\" > /dev/null 2>&1"


#! Start the wifiweb service on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Starting the wifiweb service on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S systemctl enable wifiweb --now > /dev/null 2>&1"