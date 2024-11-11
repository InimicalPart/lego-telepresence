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

export async function runTerminalCommand(command: string) {
  return new Promise<string>((resolve, reject) => {
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
  } catch (e) {
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
    hidden?: boolean
}) {

    let parametersToAdd = []

    if (data.ssid) {
        parametersToAdd.push(`802-11-wireless.ssid "${data.ssid}"`)
        parametersToAdd.push(`connection.id "${data.ssid}"`)
    }

    parametersToAdd.push(`802-11-wireless-security.key-mgmt ${data.wifiSecurity}`)

    if (data.autoconnect) {
        if (data.autoconnect.enabled) {
            parametersToAdd.push(`connection.autoconnect yes`)
            parametersToAdd.push(`connection.autoconnect-priority ${data.autoconnect.priority ?? 0}`)
            parametersToAdd.push(`connection.autoconnect-retries ${data.autoconnect.retries ?? 5}`)
        }
    }

    if (data.wifiSecurity == "wpa-psk") {
        if (data.password) {
            parametersToAdd.push(`802-11-wireless-security.psk "${data.password}"`)
        }
    } else if (data.wifiSecurity == "wpa-eap") {
        if (data.username && data.password) {
            parametersToAdd.push(`802-1x.eap peap`)
            parametersToAdd.push(`802-1x.identity "${data.username}"`)
            parametersToAdd.push(`802-1x.phase2-auth mschapv2`)
            parametersToAdd.push(`802-1x.password "${data.password}"`)
        }
    }

    if (data.static) {

        if (typeof data.static.ips == "string") {
            parametersToAdd.push(`ipv4.addresses ${data.static.ips}`)
        } else {
            parametersToAdd.push(`ipv4.addresses ${data.static.ips.join(",")}`)
        }

        parametersToAdd.push(`ipv4.gateway ${data.static.gateway}`)

        if (typeof data.static.dns == "string") {
            parametersToAdd.push(`ipv4.dns ${data.static.dns}`)
        } else {
            parametersToAdd.push(`ipv4.dns ${data.static.dns.join(",")}`)
        }
    }

    if (data.hidden) {
        parametersToAdd.push(`802-11-wireless.hidden yes`)
    }

    return `nmcli c add connection.type 802-11-wireless ${parametersToAdd.join(" ")}`
}