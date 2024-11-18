declare const global: WiFiWebGlobal;
import * as cmd from "./cmd";

export async function getConnections() {
    const nmcliExists = await cmd.commandExists("nmcli")

     //! Get all saved WiFi connections
     const connections = []

     let connectionInformations = []
 
     if (nmcliExists) {
         connectionInformations = (await cmd.runTerminalCommand("sudo nmcli -t -c no c show"))
             .split("\n")
             .map((i: string) => i.trim())
             .map((i: string) => i.replace(/:$/g, ""))
             .filter((i: string) => i !== "")
             .filter((i: string) => i.includes("802-11-wireless"))
             .map((i: string) => i.split(":"))
 
 
 
         for (const connection of connectionInformations) {
             const UUID = connection.find((i: string) => i.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/))
 
             const parsedNmcli = await nmcliParser(await getConnection(UUID as string))

             connections.push({
                name: parsedNmcli["802-11-wireless.ssid"] as string || "N/A",
                uuid: UUID || "N/A",
                wifiSecurity: parsedNmcli["802-11-wireless-security.key-mgmt"] == "none" ? "open" : parsedNmcli["802-11-wireless-security.key-mgmt"] === "wpa-eap" ? "wpa-eap" : "wpa-psk",
                credentials: parsedNmcli["802-11-wireless-security.key-mgmt"] == "none" ? null : {
                    ...(parsedNmcli["802-11-wireless-security.key-mgmt"] === "wpa-eap" ? { method: parsedNmcli["802-1x.eap"] as string , username: parsedNmcli["802-1x.identity"] as string, password: parsedNmcli["802-1x.password"] as string, phase2: parsedNmcli["802-1x.phase2-auth"] as string} : {}),
                    ...(parsedNmcli["802-11-wireless-security.key-mgmt"] === "wpa-psk" ? { password: parsedNmcli["802-11-wireless-security.psk"] as string } : {})
                },
                static: {
                    ips: !!parsedNmcli["ipv4.addresses"] ? (parsedNmcli["ipv4.addresses"] as string).split(",").map((i: string) => i.trim()) : null,
                    gateway: parsedNmcli["ipv4.gateway"] as string || null,
                    dns: !!parsedNmcli["ipv4.dns"] ? (parsedNmcli["ipv4.dns"] as string).split(",").map((i: string) => i.trim()) : null
                },
                autoconnect: {
                    enabled: parsedNmcli["connection.autoconnect"] === "yes",
                    priority: parsedNmcli["connection.autoconnect-priority"] as number || 0,
                    retries: parsedNmcli["connection.autoconnect-retries"] as number || -1
                },
                hidden: parsedNmcli["802-11-wireless.hidden"] === "yes",
                additional: {
                    ...Object.fromEntries(Object.entries(parsedNmcli).filter(([key]) => key.toLowerCase().startsWith("ip")).map(([key, value]) => [key, value?.toString() ?? null]))
                },
                interface: parsedNmcli["connection.interface-name"] as string || parsedNmcli["GENERAL.IP-IFACE"] as string || "N/A",
                connected: false
             })
 
         }


 
    } else {
        throw new Error("No network manager found")
    }

    global.connections = connections

}

export async function getNetworks() {


    //! Get the hostname of the server
    global.system.hostname = await cmd.runTerminalCommand("hostname")

    //! Detect WiFi interface(s)
    global.interfaces = await cmd.getNetworkHardware()

   
   

    await getConnections()
    await getCurrentConnection()
}

export async function getConnection(UUID: string) {
    return await cmd.runTerminalCommand(`sudo nmcli -t -c no c show ${UUID} --show-secrets`)
}

export async function getCurrentConnection() {
    const currentConns = await cmd.runTerminalCommand("sudo nmcli -t -c no c show --active").catch(() => "")
    global.connections.forEach((i: WiFiWebGlobal["connections"][0]) => i.connected = false)
    currentConns
        .split("\n")
        .map((i: string) => i.trim())
        .filter((i: string) => i !== "")
        .filter((i: string) => i.includes("802-11-wireless"))
        .map((i: string) => i.split(":"))
        .forEach((i: string[]) => {
            // set <conn>.connected = true
            const UUID = i.find((i: string) => i.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/))
            const conn = global.connections.find((i: WiFiWebGlobal["connections"][0]) => i.uuid === UUID)
            if (conn) {
                conn.connected = true
            }
        })

}


export async function nmcliParser(inp: string): Promise<{[key:string]: string | number | null}> {
    const out = inp.split("\n").map((i: string) => i.trim()).filter((i: string) => i !== "").map((i: string) => i.split(":"))

    for (let i = 0; i < out.length; i++) {
        out[i] = [out[i][0], out[i].slice(1).join(":")]
    }

    const  outObj: {
        [key:string]: string | number | null
    } = {}

    for (const i of out) {
        const key = i[0];
        let value: string | number | null = i[1] || null;

        if (value !== null && !isNaN(Number(value))) {
            value = Number(value);
        }

        outObj[key] = value;
    }

    return outObj;
}