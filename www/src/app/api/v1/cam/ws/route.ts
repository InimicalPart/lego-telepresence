import { LTPGlobal } from '@/interfaces/global';
import { generateWSID } from '@/utils/ws';
import { send } from 'process';

declare const global: LTPGlobal;

export async function GET(){}

export async function SOCKET(
    client: import('ws').WebSocket,
    request: import('http').IncomingMessage,
    server: import('ws').WebSocketServer,
  ) {
    console.log("[WS] A camera client has connected");
    client.send(JSON.stringify({type: "identify"}));
    client.on('close', () => {
        const index = global.connections.findIndex(conn => conn.connection === client);
        const SN = global.connections[index]?.cam?.serialNumber;
        if (index !== -1) {
            global.connections.splice(index, 1);
        }
        console.log(`[WS] Camera disconnected: ${SN}`);
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
                if (global.connections.filter(conn=>!!conn.cam).some(cam => cam?.cam?.serialNumber === data.serialNumber)) {
                    return client.send(JSON.stringify({error: "Camera already connected"}));
                }
                global.connections.push({
                    id: await generateWSID(),
                    type: "cam",
                    cam: data,
                    connection: client
                });
                client.send(JSON.stringify({type: "connected"}));
                console.log(`[WS] Camera connected: ${data.serialNumber}`);
                client.send(JSON.stringify({type: "keepAlive", enabled: true}));
                break;
            case "ok":
                console.log(`[WS] Camera responded with OK`);
                break;
            default:
                console.log(`[WS] Unknown message type: ${data.type}`);
                console.log(data);
                break;
        }

    })
  }