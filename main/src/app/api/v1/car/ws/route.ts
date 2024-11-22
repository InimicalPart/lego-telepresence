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
                delete data.nonce;
                if (global.connections.filter(conn=>!conn.cam).some(car => car?.car?.MACAddress.toUpperCase() === data.MACAddress.toUpperCase())) {
                    console.log(`[WS] Car already connected: ${data.MACAddress.toUpperCase()}`);
                    return client.send(JSON.stringify({error: "Car already connected"}));
                }
                global.connections.push({
                    id: await generateWSID("car-"),
                    type: "car",
                    car: data,
                    connection: client,
                    ready: false
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