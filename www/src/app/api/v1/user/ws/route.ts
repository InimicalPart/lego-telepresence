import { LTPGlobal } from '@/interfaces/global';
import { generateWSID, InimizedWS, inimizeWSClient } from '@/utils/ws';
import { send } from 'process';

declare const global: LTPGlobal;

export async function GET(){}

export async function SOCKET(
    client: InimizedWS,
    request: import('http').IncomingMessage,
    server: import('ws').WebSocketServer,
  ) {
    client = await inimizeWSClient(client);
    console.log("[WS] A user client has connected");
    client.on('close', () => {
        const index = global.connections.findIndex(conn => conn.connection === client);
        if (index !== -1) {
            global.connections.splice(index, 1);
        }
        console.log(`[WS] User disconnected: ${global.connections.find(conn => conn.connection === client)?.id}`);
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
            case "query":
                const connId = data.id;
                const query = data.query;
                const conn = global.connections.find(conn => conn.id === connId);

                if (!conn) {
                    console.log(`[WS] User requested data from non-existent connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection not found"}));
                }

                const allowedQueries = ["status", "battery"];
                if (!allowedQueries.includes(query)) {
                    console.log(`[WS] User requested invalid query: ${query}`);
                    return client.send(JSON.stringify({error: "Invalid query"}));
                }

                conn.connection.sendAndAwait({type: query}).then((response) => {
                    client.send(JSON.stringify(response));
                }).catch((error) => {
                    console.log(`[WS] Error sending query: ${error}`);
                    client.send(JSON.stringify({error: "Error sending query"}));
                })
                break;
            default:
                console.log(`[WS] Unknown message type: ${data.type}`);
                console.log(data);
                break;
        }

    })
  }