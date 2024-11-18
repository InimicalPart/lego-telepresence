/*
 * Copyright (c) 2024 Inimi | InimicalPart
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { exec } from "child_process";

declare const global: WiFiWebGlobal

export async function runTerminalCommand(command: string) {
  return new Promise<string>((resolve, reject) => {


    
    console.log(`[CMD] Running command: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

        if (stderr && !stdout) {
            reject(stderr.trim());
            return;
        }

      resolve(stdout.trim());
    });
  });
}

export async function commandExists(command: string) {
  try {
    await runTerminalCommand(`command -v ${command}`);
    return true;
  } catch {
    return false;
  }
}


export async function createWiFiCommandGenerator(data: {
    ssid: string,
    wifiSecurity: "wpa-psk" | "wpa-eap" | "none",
    username?: string,
    password?: string,

    static?: {
        ips: string[] | string,
        gateway: string,
        dns: string[] | string
    },
    autoconnect?: {
        enabled: boolean,
        priority?: number,
        retries?: number

    }
    hidden?: boolean,
    interface?: string | null
}) {
    return `sudo nmcli c add connection.type 802-11-wireless ${await createNmcliParameters(data)}`
}

export async function modifyWiFiCommandGenerator(UUID:string, data: {
    ssid?: string,
    wifiSecurity?: "wpa-psk" | "wpa-eap" | "none",
    username?: string,
    password?: string,

    static?: {
        ips: string[] | string,
        gateway: string,
        dns: string[] | string
    },
    autoconnect?: {
        enabled: boolean,
        priority?: number,
        retries?: number

    }
    hidden?: boolean,
    interface?: string | null
}, fill: boolean = true) {
    const oldData = global.connections.find((i) => i.uuid === UUID)

    return `sudo nmcli c modify "${UUID}" ${await createNmcliParameters(data, fill ? oldData : undefined)}`
}


export async function deactivateConnection(UUID: string) {
    return await runTerminalCommand(`sudo nmcli c down "${UUID}"`)
}

export async function activateConnection(UUID: string) {
    return await runTerminalCommand(`sudo nmcli c up "${UUID}"`)
}

export const restartConnection = activateConnection

async function createNmcliParameters(data: {
    ssid?: string,
    wifiSecurity?: "wpa-psk" | "wpa-eap" | "none",
    username?: string,
    password?: string,

    static?: {
        ips: string[] | string,
        gateway: string,
        dns: string[] | string
    },
    autoconnect?: {
        enabled: boolean,
        priority?: number,
        retries?: number
    },
    interface?: string | null,
    hidden?: boolean
}, negateWith?: Partial<WiFiWebGlobal["connections"][0]>) {

    const parametersToAdd = []

    if (data.ssid && (data.ssid !== negateWith?.name)) {
        parametersToAdd.push(`802-11-wireless.ssid "${data.ssid}"`)
        parametersToAdd.push(`connection.id "${data.ssid}"`)
    }

    if (data.wifiSecurity && data.wifiSecurity !== negateWith?.wifiSecurity) {
        parametersToAdd.push(`802-11-wireless-security.key-mgmt ${data.wifiSecurity}`)
    }

    if (data.autoconnect) {
        if (data.autoconnect.enabled && (!negateWith?.autoconnect || data.autoconnect.enabled !== negateWith?.autoconnect.enabled)) {
            parametersToAdd.push(`connection.autoconnect yes`)
        }
        if (data.autoconnect.priority !== undefined && (!negateWith?.autoconnect || data.autoconnect.priority !== negateWith?.autoconnect.priority)) {
            parametersToAdd.push(`connection.autoconnect-priority ${data.autoconnect.priority ?? 0}`)
        }
        if (data.autoconnect.retries !== undefined && (!negateWith?.autoconnect || data.autoconnect.retries !== negateWith?.autoconnect.retries)) {
            parametersToAdd.push(`connection.autoconnect-retries ${data.autoconnect.retries ?? -1}`)
        }
    }

    if (data.wifiSecurity == "wpa-psk" && data.password !== negateWith?.credentials?.password) {
        if (data.password) {
            parametersToAdd.push(`802-11-wireless-security.psk "${data.password}"`)
        }
    } else if (data.wifiSecurity == "wpa-eap") {
        if (data.username && data.password && (data.username !== negateWith?.credentials?.username || data.password !== negateWith?.credentials?.password)) {
            parametersToAdd.push(`802-1x.eap peap`)
            parametersToAdd.push(`802-1x.identity "${data.username}"`)
            parametersToAdd.push(`802-1x.phase2-auth mschapv2`)
            parametersToAdd.push(`802-1x.password "${data.password}"`)
        }
    } else if (data.wifiSecurity == "none" && negateWith?.credentials) {
        parametersToAdd.push(`802-11-wireless-security.psk ""`)
        parametersToAdd.push(`802-1x.eap ""`)
        parametersToAdd.push(`802-1x.identity ""`)
        parametersToAdd.push(`802-1x.phase2-auth ""`)
        parametersToAdd.push(`802-1x.password ""`)
    }

    if (data.static) {
        if (typeof data.static.ips == "string" && typeof negateWith?.static?.ips == "string" && data.static.ips !== negateWith?.static.ips) {
            parametersToAdd.push(`ipv4.addresses "${data.static.ips}"`)
        } else if (Array.isArray(data.static.ips) && (!negateWith?.static || data.static.ips.join(",") !== negateWith?.static.ips?.join(","))) {
            parametersToAdd.push(`ipv4.addresses "${data.static.ips.join(",")}"`)
        }

        if (data.static.gateway !== negateWith?.static?.gateway) {
            parametersToAdd.push(`ipv4.gateway "${data.static.gateway}"`)
        }

        if (typeof data.static.dns == "string" && typeof negateWith?.static?.dns == "string" && data.static.dns !== negateWith?.static?.dns) {
            parametersToAdd.push(`ipv4.dns "${data.static.dns}"`)
        } else if (Array.isArray(data.static.dns) && (!negateWith?.static || data.static.dns.join(",") !== negateWith?.static.dns?.join(","))) {
            parametersToAdd.push(`ipv4.dns "${data.static.dns.join(",")}"`)
        }
    } else if (negateWith?.static) {
        
        if (negateWith?.static.ips) {
            parametersToAdd.push(`ipv4.addresses ""`)
        }
        if (negateWith?.static.gateway) {
            parametersToAdd.push(`ipv4.gateway ""`)
        }
        if (negateWith?.static.dns) {
            parametersToAdd.push(`ipv4.dns ""`)
        }
    }

    if (data.hidden && data.hidden !== negateWith?.hidden) {
        parametersToAdd.push(`802-11-wireless.hidden yes`)
    } else if (!data.hidden && negateWith?.hidden) {
        parametersToAdd.push(`802-11-wireless.hidden no`)
    }

    if (data.interface && data.interface !== negateWith?.interface) {
        parametersToAdd.push(`connection.interface-name "${data.interface}"`)
    } else if (negateWith?.interface) {
        parametersToAdd.push(`connection.interface-name ""`)
    }

    return parametersToAdd.join(" ")
}

export async function getNetworkHardware(): Promise<{
    interface: string,
    via: string,
    serial: string
}[]> {
    if (!await commandExists("lshw")) {
        throw new Error("lshw not found")
    }
    
    const json = JSON.parse(await runTerminalCommand("sudo lshw -C network -json"))
    

    return [
        ...json
        .filter((i: {class:string, capabilities: {[key:string]:string}}) => i.class === "network" && Object.keys(i.capabilities).includes("wireless"))
        .map((i: {logicalname: string | string[], businfo:string, serial: string}) => ({
            interface: typeof i.logicalname == "string" ? i.logicalname : (i.logicalname as string[]).find((i: string) => i.startsWith("wl")) ?? "N/A",
            via: i.businfo.split("@")?.[0]?.toUpperCase(),
            serial: i.serial,
        }))
    ]
}