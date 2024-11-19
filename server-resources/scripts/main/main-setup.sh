#!/bin/bash

SCRIPT_DIR=$1
USR=`logname`

if [ -f /home/$USR/.ssh/id_rsa ]; then
  ADDITIONAL_CMD="-i /home/$USR/.ssh/id_rsa"
else
  ADDITIONAL_CMD=""
fi

#! Check if the NginX service exists
NGINX_EXISTS=`sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S systemctl status nginx >/dev/null 2>&1; echo \\\$?"`

if [ "$NGINX_EXISTS" -eq 0 ]; then
    echo "[MAIN] NGINX service exists on $MAIN_UPLOAD_HOST"
else
    echo "[MAIN] NGINX service does not exist on $MAIN_UPLOAD_HOST"
fi

if [ "$NGINX_EXISTS" -eq 0 ]; then
    #! Stop the NGINX service
    echo "[MAIN] Stopping the NGINX service on $MAIN_UPLOAD_HOST"
    sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S systemctl disable nginx --now > /dev/null 2>&1"
fi

#! Check if the Main Website service exists
MAIN_EXISTS=`sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S systemctl status main >/dev/null 2>&1; echo \\\$?"`

if [ "$MAIN_EXISTS" -eq 0 ]; then
    echo "[MAIN] Main Website service exists on $MAIN_UPLOAD_HOST"
else
    echo "[MAIN] Main Website service does not exist on $MAIN_UPLOAD_HOST"
fi

if [ "$MAIN_EXISTS" -eq 0 ]; then
    #! Stop the Main Website service
    echo "[MAIN] Stopping the Main Website service on $MAIN_UPLOAD_HOST"
    sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S systemctl disable main --now > /dev/null 2>&1"
fi

#! Copy over $SD/sudoers/main-access to /etc/sudoers.d/main-access on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Uploading sudoers file to $MAIN_UPLOAD_HOST"
SUDOERS_CONTENT=`cat $SCRIPT_DIR/sudoers/main-access | base64`
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$SUDOERS_CONTENT\" | base64 -d > /etc/sudoers.d/main-access && chmod 440 /etc/sudoers.d/main-access' > /dev/null 2>&1"

#! Copy over $SCRIPT_DIR/services/main.service to /etc/systemd/system/main.service on $MAIN_UPLOAD_HOST as sudo and symlink it to /lib/systemd/system/main.service
echo "[MAIN] Uploading systemd service file to $MAIN_UPLOAD_HOST"
SYSTEMD_CONTENT=`cat $SCRIPT_DIR/services/main.service | base64`
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$SYSTEMD_CONTENT\" | base64 -d > /etc/systemd/system/main.service && ln -s /etc/systemd/system/main.service /lib/systemd/system/main.service' > /dev/null 2>&1"

#! Copy over $SCRIPT_DIR/misc/main/LTP-WWW.conf to /etc/nginx/conf.d/LTP-WWW.conf on $MAIN_UPLOAD_HOST as sudo 
echo "[MAIN] Uploading NGINX configuration file to $MAIN_UPLOAD_HOST"
NGINX_CONTENT=`cat $SCRIPT_DIR/misc/main/LTP-WWW.conf | base64`
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$NGINX_CONTENT\" | base64 -d > /etc/nginx/conf.d/LTP-WWW.conf' > /dev/null 2>&1"

#! Copy over $SCRIPT_DIR/misc/main/unavailable.html to /var/www/errors/unavailable.html on $MAIN_UPLOAD_HOST as sudo, but make sure the directory /var/www/errors exists
echo "[MAIN] Uploading NGINX error file to $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S mkdir -p /var/www/errors > /dev/null 2>&1"
ERROR_CONTENT=`cat $SCRIPT_DIR/misc/main/unavailable.html | base64`
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S sh -c 'echo \"$ERROR_CONTENT\" | base64 -d > /var/www/errors/unavailable.html' > /dev/null 2>&1"

#! Reload systemd on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Reloading systemd on $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S systemctl daemon-reload > /dev/null 2>&1"

#! Remove any left-overs in $MAIN_FINAL_DIR on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Removing left-overs in $MAIN_FINAL_DIR/main on $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S rm -rf $MAIN_FINAL_DIR/main > /dev/null 2>&1"

#! Move over the folder in $MAIN_UPLOAD_DIR to $MAIN_FINAL_DIR on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Moving files to $MAIN_FINAL_DIR/main"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S mv -f $MAIN_UPLOAD_DIR/main $MAIN_FINAL_DIR/main > /dev/null 2>&1"

ACCOUNT_EXISTS=`sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S id \"$MAIN_GIVE_RIGHTS_TO\" >/dev/null 2>&1; echo \\\$?"`

if [ "$ACCOUNT_EXISTS" -ne 0 ]; then
    #! Create an account called "$MAIN_GIVE_RIGHTS_TO" on $MAIN_UPLOAD_HOST
    echo "[MAIN] Creating an account for $MAIN_GIVE_RIGHTS_TO on $MAIN_UPLOAD_HOST"
    sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S adduser --disabled-password --gecos \"\" --home \"/home/$MAIN_GIVE_RIGHTS_TO\" --shell \"/sbin/nologin\" --uid \"10001\" $MAIN_GIVE_RIGHTS_TO";
fi

#! Give ownership of $MAIN_FINAL_DIR to $MAIN_GIVE_RIGHTS_TO on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Giving rights to $MAIN_GIVE_RIGHTS_TO on $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S chown -R $MAIN_GIVE_RIGHTS_TO:$MAIN_GIVE_RIGHTS_TO \"$MAIN_FINAL_DIR/main\" > /dev/null 2>&1"


#! Start the Main Website service on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Starting the Main Website service on $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S systemctl enable main --now > /dev/null 2>&1"

#! Start the NGINX service on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Starting the NGINX service on $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S systemctl enable nginx --now > /dev/null 2>&1"

#! Allow all connections on 80, 443, 1935 and 8000
echo "[MAIN] Allowing all connections on 80, 443, 1935 and 8000 on $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S ufw allow 80,443,1935,8000/tcp > /dev/null 2>&1"
