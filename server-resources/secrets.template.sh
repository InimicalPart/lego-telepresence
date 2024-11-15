#! This is the secrets file, this will be used by the setup script to
#! configure the server and the Raspberry Pi for use with lia-telepresence
#!
#! When you're done editing this file, rename it to secrets.sh

WIFIWEB_UPLOAD_USERNAME="pi" #! The username that will be used to log in to SSH
WIFIWEB_UPLOAD_PASSWORD="raspberry" #! The password that will be used to log in to SSH, and run as sudo
WIFIWEB_UPLOAD_HOST="myraspberrypi.local" #! The server's domain or IP address
WIFIWEB_UPLOAD_DIR="/tmp" #! The directory where all of the files will be uploaded to (should be a world writable directory)
WIFIWEB_FINAL_DIR="/opt/wifiweb" #! The directory where all of the files will be copied to (as sudo) (needs to match WorkingDirectory in ../services/wifiweb.service)
WIFIWEB_GIVE_RIGHTS_TO="lowpriv" #! The user that will be given rights to the files in WIFIWEB_FINAL_DIR (owner) (needs to match sudo user in ../services/wifiweb.service)

SERVER_UPLOAD_USERNAME="root" #! The username that will be used to log in to SSH
SERVER_UPLOAD_PASSWORD="root" #! The password that will be used to log in to SSH, and run as sudo
SERVER_UPLOAD_HOST="myserver.com" #! The server's domain or IP address
SERVER_UPLOAD_DIR="/tmp" #! The directory where all of the files will be uploaded to (should be a world writable directory)
SERVER_FINAL_DIR="/opt/www" #! The directory where all of the files will be copied to (as sudo)
SERVER_GIVE_RIGHTS_TO="lowpriv" #! The user that will be given rights to the files in SERVER_FINAL_DIR (owner)
