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
echo "[CAM-CLIENT] Uploading sudoers file to $CAM_CLIENT_UPLOAD_HOST"
SUDOERS_CONTENT=`cat $SCRIPT_DIR/sudoers/cam-client-access | base64`
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$SUDOERS_CONTENT\" | base64 -d > /etc/sudoers.d/cam-client-access && chmod 440 /etc/sudoers.d/cam-client-access' > /dev/null 2>&1"

#! Copy over $SCRIPT_DIR/services/cam-client.service to /etc/systemd/system/cam-client.service on $CAM_CLIENT_UPLOAD_HOST as sudo and symlink it to /lib/systemd/system/cam-client.service
echo "[CAM-CLIENT] Uploading systemd service file to $CAM_CLIENT_UPLOAD_HOST"
SYSTEMD_CONTENT=`cat $SCRIPT_DIR/services/cam-client.service | base64`
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$SYSTEMD_CONTENT\" | base64 -d > /etc/systemd/system/cam-client.service && ln -s /etc/systemd/system/cam-client.service /lib/systemd/system/cam-client.service' > /dev/null 2>&1"

#! Reload systemd on $CAM_CLIENT_UPLOAD_HOST as sudo
echo "[CAM-CLIENT] Reloading systemd on $CAM_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl daemon-reload > /dev/null 2>&1"

#! Remove any left-overs in $CAM_CLIENT_FINAL_DIR on $CAM_CLIENT_UPLOAD_HOST as sudo
echo "[CAM-CLIENT] Removing left-overs in $CAM_CLIENT_FINAL_DIR/cam-client on $CAM_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S rm -rf $CAM_CLIENT_FINAL_DIR/cam-client > /dev/null 2>&1"

#! Move over the folder in $CAM_CLIENT_UPLOAD_DIR to $CAM_CLIENT_FINAL_DIR on $CAM_CLIENT_UPLOAD_HOST as sudo
echo "[CAM-CLIENT] Moving files to $CAM_CLIENT_FINAL_DIR/cam-client"
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S mv -f $CAM_CLIENT_UPLOAD_DIR/cam-client $CAM_CLIENT_FINAL_DIR/cam-client > /dev/null 2>&1"

ACCOUNT_EXISTS=`sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S id \"$CAM_CLIENT_GIVE_RIGHTS_TO\" >/dev/null 2>&1; echo \\\$?"`

if [ "$ACCOUNT_EXISTS" -ne 0 ]; then
    #! Create an account called "$CAM_CLIENT_GIVE_RIGHTS_TO" on $CAM_CLIENT_UPLOAD_HOST
    echo "[CAM-CLIENT] Creating an account for $CAM_CLIENT_GIVE_RIGHTS_TO on $CAM_CLIENT_UPLOAD_HOST"
    sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S adduser --disabled-password --gecos \"\" --home \"/home/$CAM_CLIENT_GIVE_RIGHTS_TO\" --shell \"/sbin/nologin\" --uid \"10001\" $CAM_CLIENT_GIVE_RIGHTS_TO";
fi

USER_ID=`sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S id -u \"$CAM_CLIENT_GIVE_RIGHTS_TO\""`
#! Grant permissions to connect to bluetooth devices for "$CAM_CLIENT_GIVE_RIGHTS_TO"
echo "[CAM-CLIENT] Granting permissions to connect to bluetooth devices for "$CAM_CLIENT_GIVE_RIGHTS_TO" on $CAM_CLIENT_UPLOAD_HOST"
PERMISSIONS_CONTENT=`echo '<!DOCTYPE busconfig PUBLIC "-//freedesktop//DTD D-BUS Bus Configuration 1.0//EN"
  "http://www.freedesktop.org/standards/dbus/1.0/busconfig.dtd">
<busconfig>
  <policy user="__UID__">
   <allow own="org.bluez"/>
    <allow send_destination="org.bluez"/>
    <allow send_interface="org.bluez.GattCharacteristic1"/>
    <allow send_interface="org.bluez.GattDescriptor1"/>
    <allow send_interface="org.freedesktop.DBus.ObjectManager"/>
    <allow send_interface="org.freedesktop.DBus.Properties"/>
  </policy>
</busconfig>' | sed "s/__UID__/$USER_ID/g"`
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$PERMISSIONS_CONTENT\" > /etc/dbus-1/system.d/node-ble-cam.conf' > /dev/null 2>&1"

#! Give ownership of $CAM_CLIENT_FINAL_DIR to $CAM_CLIENT_GIVE_RIGHTS_TO on $CAM_CLIENT_UPLOAD_HOST as sudo
echo "[CAM-CLIENT] Giving rights to $CAM_CLIENT_GIVE_RIGHTS_TO on $CAM_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S chown -R $CAM_CLIENT_GIVE_RIGHTS_TO:$CAM_CLIENT_GIVE_RIGHTS_TO \"$CAM_CLIENT_FINAL_DIR/cam-client\" > /dev/null 2>&1"

#! Start the cam-client service on $CAM_CLIENT_UPLOAD_HOST as sudo
echo "[CAM-CLIENT] Starting the cam-client service on $CAM_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAM_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAM_CLIENT_UPLOAD_USERNAME $CAM_CLIENT_UPLOAD_HOST "echo \"$CAM_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl enable cam-client --now > /dev/null 2>&1"