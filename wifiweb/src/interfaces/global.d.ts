interface WiFiWebGlobal extends NodeJS.Global {
    hostname: string,
    interfaces: string[],
    connections: {
        uuid: string;
        name: string;
        type: string;
        credentials: {
            method?: string;
            username?: string;
            phase2?: string;
            password?: string;
        } | null;
    }[],
    currentConnection: WiFiWebGlobal["connections"][0] | null
}