interface CamClientGlobal extends NodeJS.Global {
    config: {
        DEVELOPMENT: boolean,
        CAMERA_MAC: string,
    }
}