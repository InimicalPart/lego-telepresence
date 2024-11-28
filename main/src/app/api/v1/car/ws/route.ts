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
    global.events.emit("accessoryPreConnect", {type: "car"});
    global.events.emit("carPreConnect", {});
    client.send(JSON.stringify({type: "identify"}));
    client.on('close', () => {
        const index = global.connections.findIndex(conn => conn.connection === client);
        const id = global.connections[index]?.id;
        global.events.emit("carPreDisconnect", {id});
        global.events.emit("accessoryPreDisconnect", {type: "car", id});
        const MAC = global.connections[index]?.car?.MACAddress.toUpperCase();
        if (index !== -1) {
            global.connections.splice(index, 1);
        }
        console.log(`[WS] Car disconnected: ${MAC}`);
        global.events.emit("carDisconnect", {id});
        global.events.emit("accessoryDisconnect", {type: "car", id});
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
                const connID = await generateWSID("car-")
                global.connections.push({
                    id: connID,
                    type: "car",
                    car: {...data, inControlBy: null},
                    connection: client,
                    ready: false
                });
                client.send(JSON.stringify({type: "connected"}));
                client.send(JSON.stringify({type: "system"}));
                console.log(`[WS] Car connected: ${data.MACAddress.toUpperCase()} (${connID})`);
                global.events.emit("accessoryConnect", {type: "car" , id: connID, data});
                global.events.emit("carConnect", {id: connID, data});
                break;
            case "ok":
                console.log(`[WS] Car responded with OK`);
                break;
            case "system":
                console.log(`[WS] Car responded with system info`);
                const connection = global.connections.find(conn => conn.connection === client);
                if (connection) {
                    delete data.type
                    delete data.nonce
                    connection.system = data;
                    global.events.emit("systemReceived", {id: connection.id, type: "car", data});
                }
                break
            case "status":
                console.log(`[WS] Car responded with status: ${data.connected ? "connected" : "disconnected"}`);
                break;
            case "battery":
                console.log(`[WS] Car responded with battery: ${data.level}%`);
                break;
            default:
                console.log(`[WS] Unknown message type: ${data.type}`);
                console.log(data);
                break;
        }

    })
  }