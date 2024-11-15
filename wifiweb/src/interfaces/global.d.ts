interface WiFiWebGlobal extends NodeJS.Global {
    interfaces: {
        interface: string,
        via: string,
        serial: string
    }[],
    connections: {
        uuid: string;
        name: string;
        wifiSecurity: string;
        credentials: {
            method?: string;
            username?: string;
            phase2?: string;
            password?: string;
        } | null;
        static: {
            ips: string[] | null;
            gateway: string | null;
            dns: string[] | null;
        },
        autoconnect: {
            enabled: boolean;
            priority: number;
            retries: number;
        },
        hidden: boolean,
        additional: {
            [key: string]: string | null
        },
        interface: string,
        connected: boolean
    }[],
    currentConnection: WiFiWebGlobal["connections"][0] | null,
    system: {
        startedAt: Date,
        hostname: string
    },
    isSystemd: boolean
}