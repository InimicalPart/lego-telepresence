declare const global: WiFiWebGlobal;
import * as cmd from "./cmd";
import ini from "ini";
import y2j from "js-yaml";

export async function getConnections() {
    const netplanExists = await cmd.commandExists("netplan")
    const nmcliExists = await cmd.commandExists("nmcli")

     //! Get all saved WiFi connections
     let connections = []

     let connectionInformations = []
 
     if (!netplanExists && nmcliExists) {
 
         connectionInformations = (await cmd.runTerminalCommand("nmcli -t -c no c show"))
             .split("\n")
             .map((i: string) => i.trim())
             .map((i: string) => i.replace(/:$/g, ""))
             .filter((i: string) => i !== "")
             .filter((i: string) => i.includes("802-11-wireless"))
             .map((i: string) => i.split(":"))
 
 
 
         for (const connection of connectionInformations) {
             const name = connection[0]
             const UUID = connection.find((i: string) => i.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/))
 
             const connectionInfo = [
                 ...(await cmd.runTerminalCommand(`sudo find /etc/NetworkManager/system-connections -type f -name "*.nmconnection"`).catch(()=>"")).split("\n").map((i: string) => i.trim()).filter((i: string) => i !== ""),
                 ...(await cmd.runTerminalCommand(`sudo find /run/NetworkManager/system-connections -type f -name "*.nmconnection"`).catch(()=>"")).split("\n").map((i: string) => i.trim()).filter((i: string) => i !== "")
             ]
 
             const connFile = connectionInfo.find((i: string) => {
                 return i.includes(UUID as string)
             })
 
 
             const contents = await cmd.runTerminalCommand(`sudo cat "${connFile}"`)
 
             const parsed = ini.parse(contents)
 
             connections.push({
                 name: name,
                 uuid: UUID,
                 type: !parsed["wifi-security"] ? "OPEN" : parsed["wifi-security"]["key-mgmt"] === "wpa-eap" ? "WPA-EAP" : "WPA-PSK",
                 credentials: !parsed["wifi-security"] ? null : {
                     ...(parsed["wifi-security"]["key-mgmt"] === "wpa-eap" ? { method: parsed["802-1x"].eap, username: parsed["802-1x"].identity, password: parsed["802-1x"].password, phase2: parsed["802-1x"]["phase2-auth"] } : {}),
                     ...(parsed["wifi-security"]["key-mgmt"] === "wpa-psk" ? { password: parsed["wifi-security"].psk } : {})
                 }
             })
 
         }
 
     } else if (netplanExists) {
         const netplanOutput = (await cmd.runTerminalCommand("sudo netplan get"))
         const netplanConfig: any = y2j.load(netplanOutput)
 
         if (netplanConfig.network?.wifis) {
             for (const connection of Object.values(netplanConfig.network.wifis) as any) {
                 const connectionName = connection.networkmanager.name
                 const connectionUUID = connection.networkmanager.uuid
 
                 const deeperConn = Object.values(connection["access-points"])[0] as any
 
                 let connectionType = ""
 
                 switch (deeperConn?.auth?.["key-management"]) {
 
                     case "psk":
                         connectionType = "WPA-PSK"
                         break;
                     case "eap":
                         connectionType = "WPA-EAP"
                         break;
                     default:
                         connectionType = "OPEN"
                         break;
                 }
 
                 connections.push({
                     uuid: connectionUUID,
                     name: connectionName,
                     type: connectionType,
                     credentials: connectionType === "OPEN" ? null : {
                         ...(connectionType === "WPA-EAP" ? { method: deeperConn.auth.method, username: deeperConn.auth.identity, phase2:deeperConn.auth["phase2-auth"], password: deeperConn.auth.password } : {}),
                         ...(connectionType === "WPA-PSK" ? { password: deeperConn.auth.password } : {})
                     }
                 })
             }
         }            
     } else {
         throw new Error("No network manager found")
     }

    global.connections = connections

}

export async function getNetworks() {

    //! Get the hostname of the server
    global.hostname = await cmd.runTerminalCommand("hostname")

    //! Detect WiFi interface(s)
    global.interfaces = (await cmd.runTerminalCommand("ls /sys/class/net | grep wl")).split("\n").map((i: string) => i.trim()).filter((i: string) => i !== "")

   
   
    await getConnections()
    await getCurrentConnection()
}

export async function getCurrentConnection() {
    let currentConnName = await cmd.runTerminalCommand("nmcli -t -c no c show --active").catch(() => "")
    currentConnName = currentConnName
        .split("\n")
        .map((i: string) => i.trim())
        .filter((i: string) => i !== "")
        .filter((i: string) => i.includes("802-11-wireless"))
        .map((i: string) => i.split(":"))[0][0]


    global.currentConnection = global.connections.find((i: any) => i.name === currentConnName) || null

}