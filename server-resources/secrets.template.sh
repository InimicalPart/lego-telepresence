#! This is the secrets file, this will be used by the setup and cleanup script to
#! configure the server and the Raspberry Pi for use with lia-telepresence
#!
#! When you're done editing this file, rename it to secrets.sh

WIFIWEB_UPLOAD_USERNAME="pi" #! The username that will be used to log in to SSH, and run as sudo
WIFIWEB_UPLOAD_PASSWORD="raspberry" #! The password that will be used to log in to SSH, and run as sudo
WIFIWEB_UPLOAD_HOST="myraspberrypi.local" #! The server's domain or IP address
WIFIWEB_UPLOAD_DIR="/tmp" #! The directory where all of the files will be uploaded to (should be a world writable directory)
WIFIWEB_FINAL_DIR="/opt" #! The directory where all of the files will be copied to (as sudo) (needs to match WorkingDirectory (without dir name) in ../services/wifiweb.service)
WIFIWEB_GIVE_RIGHTS_TO="lowpriv" #! The user that will be given rights to the files in WIFIWEB_FINAL_DIR (owner) (needs to match sudo user in ../services/wifiweb.service and user in ../sudoers/wifiweb-access)

MAIN_UPLOAD_USERNAME="root" #! The username that will be used to log in to SSH, and run as sudo
MAIN_UPLOAD_PASSWORD="root" #! The password that will be used to log in to SSH, and run as sudo
MAIN_UPLOAD_HOST="myserver.com" #! The server's domain or IP address
MAIN_UPLOAD_DIR="/tmp" #! The directory where all of the files will be uploaded to (should be a world writable directory)
MAIN_FINAL_DIR="/opt" #! The directory where all of the files will be copied to (as sudo) (needs to match WorkingDirectory (without dir name) in ../services/main.service)
MAIN_GIVE_RIGHTS_TO="lowpriv" #! The user that will be given rights to the files in MAIN_FINAL_DIR (owner) (needs to match sudo user in ../services/main.service and user in ../sudoers/main-access)

CAR_CLIENT_UPLOAD_USERNAME=$WIFIWEB_UPLOAD_USERNAME #! The username that will be used to log in to SSH, and run as sudo
CAR_CLIENT_UPLOAD_PASSWORD=$WIFIWEB_UPLOAD_PASSWORD #! The password that will be used to log in to SSH, and run as sudo
CAR_CLIENT_UPLOAD_HOST=$WIFIWEB_UPLOAD_HOST #! The server's domain or IP address
CAR_CLIENT_UPLOAD_DIR=$WIFIWEB_UPLOAD_DIR #! The directory where all of the files will be uploaded to (should be a world writable directory)
CAR_CLIENT_FINAL_DIR=$WIFIWEB_FINAL_DIR #! The directory where all of the files will be copied to (as sudo) (needs to match WorkingDirectory (without dir name) in ../services/car-client.service)
CAR_CLIENT_GIVE_RIGHTS_TO=$WIFIWEB_GIVE_RIGHTS_TO #! The user that will be given rights to the files in CAR_CLIENT_FINAL_DIR (owner) (needs to match sudo user in ../services/car-client.service and user in ../sudoers/car-client-access)

CAM_CLIENT_UPLOAD_USERNAME=$WIFIWEB_UPLOAD_USERNAME #! The username that will be used to log in to SSH, and run as sudo
CAM_CLIENT_UPLOAD_PASSWORD=$WIFIWEB_UPLOAD_PASSWORD #! The password that will be used to log in to SSH, and run as sudo
CAM_CLIENT_UPLOAD_HOST=$WIFIWEB_UPLOAD_HOST #! The server's domain or IP address
CAM_CLIENT_UPLOAD_DIR=$WIFIWEB_UPLOAD_DIR #! The directory where all of the files will be uploaded to (should be a world writable directory)
CAM_CLIENT_FINAL_DIR=$WIFIWEB_FINAL_DIR #! The directory where all of the files will be copied to (as sudo) (needs to match WorkingDirectory (without dir name) in ../services/cam-client.service)
CAM_CLIENT_GIVE_RIGHTS_TO=$WIFIWEB_GIVE_RIGHTS_TO #! The user that will be given rights to the files in CAM_CLIENT_FINAL_DIR (owner) (needs to match sudo user in ../services/cam-client.service and user in ../sudoers/cam-client-access)