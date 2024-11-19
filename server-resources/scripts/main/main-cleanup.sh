#!/bin/bash

SCRIPT_DIR=$1
USR=`logname`

if [ -f /home/$USR/.ssh/id_rsa ]; then
  ADDITIONAL_CMD="-i /home/$USR/.ssh/id_rsa"
else
  ADDITIONAL_CMD=""
fi

#! Deny all connections on 80, 443, 1935 and 8000
echo "[MAIN] Denying all connections on 80, 443, 1935 and 8000 on $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S ufw deny 80,443,1935,8000/tcp > /dev/null 2>&1"


#! Check if the NGINX service exists
NGINX_EXISTS=`sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S systemctl status main >/dev/null 2>&1; echo \\\$?"`

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

#! Remove /etc/sudoers.d/main-access on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Removing sudoers file from $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S sh -c 'rm -rf /etc/sudoers.d/main-access' > /dev/null 2>&1"

#! Remove /etc/systemd/system/main.service on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Removing systemd service file from $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S sh -c 'rm -rf /etc/systemd/system/main.service && rm -rf /lib/systemd/system/main.service' > /dev/null 2>&1"

#! Remove /etc/nginx/conf.d/LTP-WWW.conf on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Removing NGINX configuration file from $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S sh -c 'rm -rf /etc/nginx/conf.d/LTP-WWW.conf' > /dev/null 2>&1"

#! Remove /var/www/errors/unavailable.html on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Removing NGINX error file from $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S sh -c 'rm -rf /var/www/errors/unavailable.html' > /dev/null 2>&1"

#! Reload systemd on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Reloading systemd on $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S systemctl daemon-reload > /dev/null 2>&1"

#! Remove any left-overs of the main website in $MAIN_FINAL_DIR on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Removing any left-overs in $MAIN_FINAL_DIR/main on $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S rm -rf $MAIN_FINAL_DIR/main > /dev/null 2>&1"

#! Remove any left-overs of the main website in $MAIN_UPLOAD_DIR on $MAIN_UPLOAD_HOST as sudo
echo "[MAIN] Removing any left-overs in $MAIN_UPLOAD_DIR/main on $MAIN_UPLOAD_HOST"
sshpass -P passphrase -p "$MAIN_UPLOAD_PASSWORD" ssh $ADDITIONAL_CMD -o StrictHostKeyChecking=no -o PreferredAuthentications=publickey -l $MAIN_UPLOAD_USERNAME $MAIN_UPLOAD_HOST "echo \"$MAIN_UPLOAD_PASSWORD\" | sudo -S rm -rf $MAIN_UPLOAD_DIR/main > /dev/null 2>&1"
