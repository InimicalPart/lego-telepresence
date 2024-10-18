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
    console.log("[WS] A car client has connected");
    client.send(JSON.stringify({type: "identify"}));
    client.on('close', () => {
        const index = global.connections.findIndex(conn => conn.connection === client);
        const MAC = global.connections[index]?.car?.MACAddress.toUpperCase();
        if (index !== -1) {
            global.connections.splice(index, 1);
        }
        console.log(`[WS] Car disconnected: ${MAC}`);
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
                if (global.connections.filter(conn=>!conn.cam).some(car => car?.car?.MACAddress.toUpperCase() === data.MACAddress.toUpperCase())) {
                    return client.send(JSON.stringify({error: "Car already connected"}));
                }
                global.connections.push({
                    id: await generateWSID(),
                    type: "car",
                    car: data,
                    connection: client
                });
                client.send(JSON.stringify({type: "connected"}));
                console.log(`[WS] Car connected: ${data.MACAddress.toUpperCase()}`);
                break;
            case "ok":
                console.log(`[WS] Car responded with OK`);
                break;
            default:
                console.log(`[WS] Unknown message type: ${data.type}`);
                console.log(data);
                break;
        }

    })
  }