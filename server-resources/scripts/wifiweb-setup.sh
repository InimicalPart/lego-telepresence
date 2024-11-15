#!/bin/bash

SCRIPT_DIR=$1
USR=`logname`

if [ -f /home/$USR/.ssh/id_rsa ]; then
  ADDITIONAL_CMD="-i /home/$USR/.ssh/id_rsa"
else
  ADDITIONAL_CMD=""
fi


#! Copy over $SD/sudoers/wifiweb-access to /etc/sudoers.d/wifiweb-access on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Uploading sudoers file to $WIFIWEB_UPLOAD_HOST"
SUDOERS_CONTENT=`cat $SCRIPT_DIR/sudoers/wifiweb-access | base64`
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$SUDOERS_CONTENT\" | base64 -d > /etc/sudoers.d/wifiweb-access && chmod 440 /etc/sudoers.d/wifiweb-access'"
echo "[WIFIWEB] Uploaded sudoers file to $WIFIWEB_UPLOAD_HOST at /etc/sudoers.d/wifiweb-access"

#! Copy over $SCRIPT_DIR/services/wifiweb.service to /etc/systemd/system/wifiweb.service on $WIFIWEB_UPLOAD_HOST as sudo and symlink it to /lib/systemd/system/wifiweb.service
echo "[WIFIWEB] Uploading systemd service file to $WIFIWEB_UPLOAD_HOST"
SYSTEMD_CONTENT=`cat $SCRIPT_DIR/services/wifiweb.service | base64`
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$SYSTEMD_CONTENT\" | base64 -d > /etc/systemd/system/wifiweb.service && ln -s /etc/systemd/system/wifiweb.service /lib/systemd/system/wifiweb.service'"
echo "[WIFIWEB] Uploaded systemd service file to $WIFIWEB_UPLOAD_HOST at /etc/systemd/system/wifiweb.service"

#! Remove any left-overs in $WIFIWEB_FINAL_DIR on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Removing left-overs in $WIFIWEB_FINAL_DIR/wifiweb on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S rm -rf $WIFIWEB_FINAL_DIR/wifiweb"
echo "[WIFIWEB] Removed left-overs in $WIFIWEB_FINAL_DIR/wifiweb on $WIFIWEB_UPLOAD_HOST"

#! Copy over the folder in $WIFIWEB_UPLOAD_DIR to $WIFIWEB_FINAL_DIR on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Copying files to $WIFIWEB_FINAL_DIR/wifiweb"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S cp -r $WIFIWEB_UPLOAD_DIR/wifiweb $WIFIWEB_FINAL_DIR/wifiweb"
echo "[WIFIWEB] Copied files to $WIFIWEB_FINAL_DIR/wifiweb"

#! Make sure all dependencies are installed on $WIFIWEB_FINAL_DIR on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Installing system dependencies on $WIFIWEB_UPLOAD_HOST"
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S apt-get install python3 python3-pip -y"

#! Make sure all dependencies are installed on $WIFIWEB_FINAL_DIR on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Installing wifiweb dependencies on $WIFIWEB_UPLOAD_HOST" #? Takes ages, install locally and upload instead?
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S \$(which npm) --prefix \"$WIFIWEB_FINAL_DIR/wifiweb\" install"


ACCOUNT_EXISTS=`sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S id \"lowpriv\" >/dev/null 2>&1; echo \\\$?"`

if [ "$ACCOUNT_EXISTS" -ne 0 ]; then
    #! Create an account called "lowpriv" on $WIFIWEB_UPLOAD_HOST
    echo "[WIFIWEB] Creating an account for lowpriv on $WIFIWEB_UPLOAD_HOST"
    sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S adduser --disabled-password --gecos \"\" --home \"/home/lowpriv\" --shell \"/sbin/nologin\" --uid \"10001\" lowpriv";
    echo "[WIFIWEB] Created an account for lowpriv on $WIFIWEB_UPLOAD_HOST"
fi

#! Build the project, by running npm run build in $WIFIWEB_FINAL_DIR/wifiweb on $WIFIWEB_UPLOAD_HOST as sudo
echo "[WIFIWEB] Building the project on $WIFIWEB_UPLOAD_HOST" #? Takes ages, build locally and upload instead?
sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S \$(which npm) --prefix \"$WIFIWEB_FINAL_DIR/wifiweb\" run build"
echo "[WIFIWEB] Built the project on $WIFIWEB_UPLOAD_HOST"

#! If $WIFIWEB_GIVE_RIGHTS_TO is not "", give ownership of $WIFIWEB_FINAL_DIR to $WIFIWEB_GIVE_RIGHTS_TO on $WIFIWEB_UPLOAD_HOST as sudo
if [ ! -z "$WIFIWEB_GIVE_RIGHTS_TO" ]; then
  echo "[WIFIWEB] Giving rights to $WIFIWEB_GIVE_RIGHTS_TO on $WIFIWEB_UPLOAD_HOST"
  sshpass -P passphrase -p "$WIFIWEB_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $WIFIWEB_UPLOAD_USERNAME $WIFIWEB_UPLOAD_HOST "echo \"$WIFIWEB_UPLOAD_PASSWORD\" | sudo -S chown -R $WIFIWEB_GIVE_RIGHTS_TO:$WIFIWEB_GIVE_RIGHTS_TO \"$WIFIWEB_FINAL_DIR/wifiweb\""
  echo "[WIFIWEB] Gave rights to $WIFIWEB_GIVE_RIGHTS_TO on $WIFIWEB_UPLOAD_HOST"
fi


