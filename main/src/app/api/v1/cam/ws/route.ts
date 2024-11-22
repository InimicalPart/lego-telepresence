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
        return client.send(JSON.stringify({status:401, error: "Unauthorized"}));
    } else {
        if (!await validateAccessoryAPI(key)) {
            return client.send(JSON.stringify({status:401, error: "Unauthorized"}));
        }
    }

    
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
                delete data.nonce;
                if (global.connections.filter(conn=>!!conn.cam).some(cam => cam?.cam?.serialNumber === data.serialNumber)) {
                    return client.send(JSON.stringify({error: "Camera already connected"}));
                }
                global.connections.push({
                    id: await generateWSID("cam-"),
                    type: "cam",
                    cam: {
                        ...data,
                        isLive: false,
                    },
                    connection: client,
                    ready: false
                });
                client.send(JSON.stringify({type: "connected"}));
                console.log(`[WS] Camera connected: ${data.serialNumber}`);
                client.send(JSON.stringify({type: "sleep"})) // Put the camera to sleep to save power
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