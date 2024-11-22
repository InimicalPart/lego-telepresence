import { LTPGlobal } from '@/interfaces/global';
import { JWTCheck } from '@/utils/auth/credCheck';
import { getRtmpUrl } from '@/utils/rtmp';
import { InimizedWS, inimizeWSClient } from '@/utils/ws';
import { notFound } from 'next/navigation';

declare const global: LTPGlobal;

export async function GET(){return notFound()}

export async function SOCKET(
    client: InimizedWS,
    request: import('http').IncomingMessage
  ) {

    const cookie = request.headers.cookie;
    const res = await JWTCheck(true, cookie)
    if (res.success !== true) return client.send(JSON.stringify({status:401, error: "Unauthorized"}));

    client = await inimizeWSClient(client);
    console.log("[WS] A user client has connected");
    client.on('close', () => {
        const index = global.connections.findIndex(conn => conn.connection === client);
        if (index !== -1) {
            global.connections.splice(index, 1);
        }
        console.log(`[WS] User disconnected`);
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

        const connId = data.id;
        const conn = global.connections.find(conn => conn.id === connId)
        const nonce = data.nonce ?? null;
        if (!conn) {
            console.log(`[WS] User requested data from non-existent connection: ${connId}`);
            return client.send(JSON.stringify({error: "Connection not found", connId, nonce}));
        }

        switch (data.type) {
            case "query":
                const query = data.query;


                if (query == "streaming") {
                    if (!conn.cam) {
                        console.log(`[WS] User requested streaming status from non-camera connection: ${connId}`);
                        return client.send(JSON.stringify({error: "Connection is not a camera", connId, nonce}));
                    }

                    console.log(`[WS] User requested streaming status: ${conn.cam.isLive}`);
                    return client.send(JSON.stringify({"type": "streaming", "streaming": conn.cam.isLive, connId, nonce}));
                }

                const allowedQueries = conn.type=="car"?
                ["status", "battery"] :
                ["status", "battery", "getInfo", "getStatusValues"];
                if (!allowedQueries.includes(query)) {
                    console.log(`[WS] User requested invalid query: ${query}`);
                    return client.send(JSON.stringify({error: "Invalid query", connId, nonce}));
                }

                conn.connection.sendAndAwait({type: query}).then((response: any) => {
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending query "${query}": ${error}`);
                    client.send(JSON.stringify({error: "Error sending query", connId, nonce}));
                })
                break;
            case "wake":
                if (!conn.cam) {
                    console.log(`[WS] User requested wake from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                conn.connection.sendAndAwait({type: "wake"},120000).then((response: any) => {
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'wake': ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'wake'", connId, nonce}));
                })
                break;

            case "keepAlive":
                if (!conn.cam) {
                    console.log(`[WS] User requested keepAlive from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                conn.connection.send(JSON.stringify({type: "keepAlive", enabled: data.enabled}));
                break;
            case "restartStream":
                // stop the broadcast with stopBroadcast, wait a few seconds, then start the broadcast with startStream, by not using the break statement, the code will continue to the next case
                await conn.connection.sendAndAwait({type: "stopBroadcast"}).catch((error: string) => {
                    console.log(`[WS] Error sending 'stopBroadcast': ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'stopBroadcast'", connId, nonce}));
                })
                if (conn.cam) conn.cam.isLive = false;
                await sleep(5000)
            
            case "connectToWiFi":
                await conn.connection.sendAndAwait({type: "connectToWiFi"}, 30000).then((response: any) => {
                    if (response.error) {
                        console.log(`[WS] Error sending 'connectToWiFi': ${response.error}`);
                        client.send(JSON.stringify({error: "Error sending 'connectToWiFi'", connId, nonce}));
                    } else {
                        if (data.type !== "restartStream") {
                            client.send(JSON.stringify({...response, connId, nonce}));
                        }
                    }
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'connectToWiFi': ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'connectToWiFi'", connId, nonce}));
                })

                
                if (data.type !== "restartStream") break;
            case "startStream":
                if (!conn.cam) {
                    console.log(`[WS] User requested startStream from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                await conn.connection.sendAndAwait({type: "startBroadcast", url:await getRtmpUrl(conn?.cam?.ssid), options: {
                    encode: false,
                    windowSize: "WINDOW_SIZE_480",
                    lens: "LENS_SUPERVIEW"
                } as any}, 45000).then((response: any) => {
                    if (conn.cam) conn.cam.isLive = true;
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'startStream': ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'startStream'", connId, nonce}));
                })
                break;
            case "claimControl":
                if (!conn.cam) {
                    console.log(`[WS] User requested claimControl from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                conn.connection.sendAndAwait({type: "claimControl", external: data.external ?? true}, 30000).then((response: any) => {
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'claimControl': ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'claimControl'", connId, nonce}));
                })
                break;
            case "stabilization":
                if (!conn.cam) {
                    console.log(`[WS] User requested stabilization from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                conn.connection.sendAndAwait({type: "stabilization", enabled: data.enabled ?? true}, 30000).then((response: any) => {
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'stabilization': ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'stabilization'", connId, nonce}));
                })
                break;

            case "setWheelAngle":
                if (!conn.car) {
                    console.log(`[WS] User requested setWheelAngle from non-car connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a car"}));
                }

                console.log(data);
                conn.connection.send({type: "setWheelAngle", angle: data.angle})
                break;
            case "setSpeed":
                if (!conn.car) {
                    console.log(`[WS] User requested setWheelAngle from non-car connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a car"}));
                }

                console.log(data);
                conn.connection.send({type: "setSpeed", amount: data.amount})
                break;
            case "stop":
            case "move":
                if (!conn.car) {
                    console.log(`[WS] User requested move/stop from non-car connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a car"}));
                }
                const type = data.type;
                delete data.type;
                delete data.id;
                conn.connection.send({type: type, data })
                break;
            case "alert":
                if (!conn.cam) {
                    console.log(`[WS] User requested alert from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                conn.connection.sendAndAwait({type: "alert", message: data.message}, 30000).then((response: any) => {
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'alert': ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'alert'", connId, nonce}));
                })

                break;
            default:
                console.log(`[WS] Unknown message type: ${data.type}`);
                console.log(data);
                break;
        }

    })
    client.send(JSON.stringify({type: "ready"}));
  }

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}