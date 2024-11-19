#!/bin/bash

SCRIPT_DIR=$1
USR=`logname`

if [ -f /home/$USR/.ssh/id_rsa ]; then
  ADDITIONAL_CMD="-i /home/$USR/.ssh/id_rsa"
else
  ADDITIONAL_CMD=""
fi


#! Check if the car-client service exists
CAR_CLIENT_EXISTS=`sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl status car-client >/dev/null 2>&1; echo \\\$?"`

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
echo "[CAR-CLIENT] Uploading sudoers file to $CAR_CLIENT_UPLOAD_HOST"
SUDOERS_CONTENT=`cat $SCRIPT_DIR/sudoers/car-client-access | base64`
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$SUDOERS_CONTENT\" | base64 -d > /etc/sudoers.d/car-client-access && chmod 440 /etc/sudoers.d/car-client-access' > /dev/null 2>&1"

#! Copy over $SCRIPT_DIR/services/car-client.service to /etc/systemd/system/car-client.service on $CAR_CLIENT_UPLOAD_HOST as sudo and symlink it to /lib/systemd/system/car-client.service
echo "[CAR-CLIENT] Uploading systemd service file to $CAR_CLIENT_UPLOAD_HOST"
SYSTEMD_CONTENT=`cat $SCRIPT_DIR/services/car-client.service | base64`
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$SYSTEMD_CONTENT\" | base64 -d > /etc/systemd/system/car-client.service && ln -s /etc/systemd/system/car-client.service /lib/systemd/system/car-client.service' > /dev/null 2>&1"

#! Reload systemd on $CAR_CLIENT_UPLOAD_HOST as sudo
echo "[CAR-CLIENT] Reloading systemd on $CAR_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl daemon-reload > /dev/null 2>&1"

#! Remove any left-overs in $CAR_CLIENT_FINAL_DIR on $CAR_CLIENT_UPLOAD_HOST as sudo
echo "[CAR-CLIENT] Removing left-overs in $CAR_CLIENT_FINAL_DIR/car-client on $CAR_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S rm -rf $CAR_CLIENT_FINAL_DIR/car-client > /dev/null 2>&1"

#! Move over the folder in $CAR_CLIENT_UPLOAD_DIR to $CAR_CLIENT_FINAL_DIR on $CAR_CLIENT_UPLOAD_HOST as sudo
echo "[CAR-CLIENT] Moving files to $CAR_CLIENT_FINAL_DIR/car-client"
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S mv -f $CAR_CLIENT_UPLOAD_DIR/car-client $CAR_CLIENT_FINAL_DIR/car-client > /dev/null 2>&1"

ACCOUNT_EXISTS=`sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S id \"$CAR_CLIENT_GIVE_RIGHTS_TO\" >/dev/null 2>&1; echo \\\$?"`

if [ "$ACCOUNT_EXISTS" -ne 0 ]; then
    #! Create an account called "$CAR_CLIENT_GIVE_RIGHTS_TO" on $CAR_CLIENT_UPLOAD_HOST
    echo "[CAR-CLIENT] Creating an account for $CAR_CLIENT_GIVE_RIGHTS_TO on $CAR_CLIENT_UPLOAD_HOST"
    sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S adduser --disabled-password --gecos \"\" --home \"/home/$CAR_CLIENT_GIVE_RIGHTS_TO\" --shell \"/sbin/nologin\" --uid \"10001\" $CAR_CLIENT_GIVE_RIGHTS_TO";
fi

USER_ID=`sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S id -u \"$CAR_CLIENT_GIVE_RIGHTS_TO\""`
#! Grant permissions to connect to bluetooth devices for "$CAR_CLIENT_GIVE_RIGHTS_TO"
echo "[CAR-CLIENT] Granting permissions to connect to bluetooth devices for "$CAR_CLIENT_GIVE_RIGHTS_TO" on $CAR_CLIENT_UPLOAD_HOST"
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
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$PERMISSIONS_CONTENT\" > /etc/dbus-1/system.d/node-ble-car.conf' > /dev/null 2>&1"

#! Give ownership of $CAR_CLIENT_FINAL_DIR to $CAR_CLIENT_GIVE_RIGHTS_TO on $CAR_CLIENT_UPLOAD_HOST as sudo
echo "[CAR-CLIENT] Giving rights to $CAR_CLIENT_GIVE_RIGHTS_TO on $CAR_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S chown -R $CAR_CLIENT_GIVE_RIGHTS_TO:$CAR_CLIENT_GIVE_RIGHTS_TO \"$CAR_CLIENT_FINAL_DIR/car-client\" > /dev/null 2>&1"

#! Start the car-client service on $CAR_CLIENT_UPLOAD_HOST as sudo
echo "[CAR-CLIENT] Starting the car-client service on $CAR_CLIENT_UPLOAD_HOST"
sshpass -P passphrase -p "$CAR_CLIENT_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $CAR_CLIENT_UPLOAD_USERNAME $CAR_CLIENT_UPLOAD_HOST "echo \"$CAR_CLIENT_UPLOAD_PASSWORD\" | sudo -S systemctl enable car-client --now > /dev/null 2>&1"