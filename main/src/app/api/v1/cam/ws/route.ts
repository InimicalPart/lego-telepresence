import { LTPGlobal } from '@/interfaces/global';
import { generateWSID, InimizedWS, inimizeWSClient, validateAccessoryAPI } from '@/utils/ws';
import { notFound } from 'next/navigation';

declare const global: LTPGlobal;

export async function GET(){return notFound()}

export async function SOCKET(
    client: InimizedWS,
    request: import('http').IncomingMessage
  ) {
    client = await inimizeWSClient(client);
    //! Validate accessory API key
    const key = request.headers.authorization?.replace("Bearer ", "");
    if (!key) {
        client.send(JSON.stringify({status:401, error: "Unauthorized"}));
        return client.close();
    } else {
        if (!await validateAccessoryAPI(key)) {
            client.send(JSON.stringify({status:401, error: "Unauthorized"}));
            return client.close();
        }
    }

    
    console.log("[WS] A camera client has connected");
    global.events.emit("accessoryPreConnect", {type: "cam"});
    global.events.emit("camPreConnect", {});
    client.send(JSON.stringify({type: "identify"}));
    client.on('close', () => {
        const index = global.connections.findIndex(conn => conn.connection === client);
        const id = global.connections[index]?.id;
        global.events.emit("camPreDisconnect", {id});
        global.events.emit("accessoryPreDisconnect", {type: "cam", id});
        const SN = global.connections[index]?.cam?.serialNumber;
        if (index !== -1) {
            global.connections.splice(index, 1);
        }
        console.log(`[WS] Camera disconnected: ${SN}`);
        global.events.emit("camDisconnect", {id});
        global.events.emit("accessoryDisconnect", {type: "cam", id});
        return
    })
    client.on('message', async (message: string) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (error) {
            console.warn(`Error parsing message: ${error}`);
            return;
        }

        switch (data.type) {
            case "identify":
                delete data.type;
                delete data.nonce;
                if (global.connections.filter(conn=>!!conn.cam).some(cam => cam?.cam?.serialNumber === data.serialNumber)) {
                    return client.send(JSON.stringify({error: "Camera already connected"}));
                }
                const connID = await generateWSID("cam-")
                global.connections.push({
                    id: connID,
                    type: "cam",
                    cam: {
                        ...data,
                        isLive: false,
                        viewers: 0,
                    },
                    connection: client,
                    ready: false
                });
                client.send(JSON.stringify({type: "connected"}));
                client.send(JSON.stringify({type: "system"}));
                console.log(`[WS] Camera connected: ${data.serialNumber} (${connID})`);
                global.events.emit("accessoryConnect", {type: "cam", id: connID, data});
                global.events.emit("camConnect", {id: connID, data});
                client.send(JSON.stringify({type: "sleep"})) // Put the camera to sleep to save power
                break;
            case "ok":
                console.log(`[WS] Camera responded with OK`);
                break;
            case "status":
                console.log(`[WS] Camera responded with status: ${data.connected ? "connected" : "disconnected"}${data.sleeping ? " (sleeping)" : ""}`);
                break;
            case "battery":
                console.log(`[WS] Camera responded with battery: ${data.level}%`);
                break;
            case "system":
                console.log(`[WS] Camera responded with system info`);
                const connection = global.connections.find(conn => conn.connection === client);
                if (connection) {
                    delete data.type
                    delete data.nonce
                    connection.system = data;
                    global.events.emit("systemReceived", {id: connection.id, type: "car", data});
                }
                break
            case "getInfo":
                console.log(`[WS] Camera responded with camera information`);
                break
            default:
                console.log(`[WS] Unknown message type from camera: ${data.type}`);
                console.log(data);
                break;
        }

    })
  }