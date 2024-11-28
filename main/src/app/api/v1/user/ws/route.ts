import { LTPGlobal } from '@/interfaces/global';
import { JWTCheck } from '@/utils/auth/credCheck';
import { getRtmpUrl } from '@/utils/rtmp';
import { generateWSID, InimizedWS, inimizeWSClient } from '@/utils/ws';
import { notFound } from 'next/navigation';

declare const global: LTPGlobal;

export async function GET(){return notFound()}

export async function SOCKET(
    client: InimizedWS,
    request: import('http').IncomingMessage
  ) {

    const cookie = request.headers.cookie;
    const res = await JWTCheck(true, cookie)
    if (res.success !== true) return client.send(JSON.stringify({ status: 401, error: "Unauthorized" }));

    client = await inimizeWSClient(client);
    const uID = await generateWSID("user-")
    console.log(`[WS] A user client has connected (${uID})`);
    let isViewer = false
    client.on('close', () => {
        const index = global.connections.findIndex(conn => conn.connection === client);
        if (index !== -1) {
            global.connections.splice(index, 1);
        }

        // If any car is in control by this user, remove the control
        global.connections.filter(conn => !!conn.car).forEach(async car => {
            if (!car.car) return;
            if (isViewer) {
                const camera = global.connections.filter(conn => !!conn.cam).find(cam => cam.cam?.serialNumber === car.car?.cameraSerial);
                if (camera) {
                    if (camera.cam) {
                        camera.cam.viewers--
                        if (camera.cam.viewers < 0) camera.cam.viewers = 0;
                        global.events.emit("viewerUpdate", {id: camera.id, count: camera.cam.viewers});
                    }
                }
            }
            if (car.car.inControlBy === uID) {
                car.car.inControlBy = null;
                global.events.emit("carUnclaimed", {id: car.id});
                car.car.coolingDown = true;
                global.events.emit("accessoryCoolingDown", {id: car.id});
                console.log(`[WS] Car unclaimed by user ${uID}: ${car.id}`);
                // If camera is live, stop the broadcast

                const camera = global.connections.filter(conn => !!conn.cam).find(cam => cam.cam?.serialNumber === car.car?.cameraSerial);

                await camera?.connection.sendAndAwait({type: "stopBroadcast"});

                
                if (global.streamMap.has(camera?.cam?.ssid ?? "")) {
                    global.streamMap.get(camera?.cam?.ssid ?? "")?.stop();
                    global.streamMap.delete(camera?.cam?.ssid ?? "");
                }

                if (camera?.cam?.isLive) {
                    camera.cam.isLive = false;
                }

                // Make the camera sleep
                await camera?.connection.sendAndAwait({type: "sleep"});

                // Wait for 5 seconds
                await sleep(5000)

                if (car.car) {
                    car.car.coolingDown = false;
                }
                global.events.emit("accessoryCoolingDownComplete", {id: car.id});
                
            }
        })

        if (global.eventRegistrars[uID]) delete global.eventRegistrars[uID];
        console.log(`[WS] User disconnected: ${uID}`);
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

        const nonce = data.nonce ?? null;


        switch (data.type) {
            case "register":
                if (!data.event && !data.events) {
                    console.log(`[WS] User ${uID} attempted to register for an event without specifying an event`);
                    return client.send(JSON.stringify({error: "Event not specified", nonce}));
                }

                if (data.event && typeof data.event != "string") {
                    console.log(`[WS] User ${uID} attempted to register for an event with an invalid event type: ${typeof data.event}`);
                    return client.send(JSON.stringify({error: "Invalid event type", nonce}));
                } else if (data.events && !Array.isArray(data.events)) {
                    console.log(`[WS] User ${uID} attempted to register for events with an invalid events type: ${typeof data.events}`);
                    return client.send(JSON.stringify({error: "Invalid events type", nonce}));
                }


                let eventsToRegister = data.events ?? [data.event];
                if (data.events && data.event) {
                    eventsToRegister.push(data.event);
                }
                eventsToRegister = Array.from(new Set(eventsToRegister));

                eventsToRegister.forEach((event: string) => {
                    if (!global.validEvents.includes(event)) {
                        console.log(`[WS] User ${uID} attempted to register for an invalid event: ${event}`);
                        return client.send(JSON.stringify({error: "Invalid event", nonce}));
                    }

                    if (global.eventRegistrars[uID]?.some(reg => reg.event === event)) {
                        console.log(`[WS] User ${uID} attempted to register for an event they are already registered for: ${event}`);
                        return client.send(JSON.stringify({error: "Already registered for event", nonce}));
                    }

                    if (!global.eventRegistrars[uID]) global.eventRegistrars[uID] = [];

                    global.eventRegistrars[uID].push({event, callback: client.send});
                    console.log(`[WS] User ${uID} registered for event: ${event}`);
                })
                client.send(JSON.stringify({type: "registered", events: eventsToRegister, nonce}));
                return;
            case "unregister":
                if (!data.event && !data.events) {
                    console.log(`[WS] User ${uID} attempted to register for an event without specifying an event`);
                    return client.send(JSON.stringify({error: "Event not specified", nonce}));
                }

                if (data.event && typeof data.event != "string") {
                    console.log(`[WS] User ${uID} attempted to register for an event with an invalid event type: ${typeof data.event}`);
                    return client.send(JSON.stringify({error: "Invalid event type", nonce}));
                } else if (data.events && !Array.isArray(data.events)) {
                    console.log(`[WS] User ${uID} attempted to register for events with an invalid events type: ${typeof data.events}`);
                    return client.send(JSON.stringify({error: "Invalid events type", nonce}));
                }


                let eventsToUnregister = data.events ?? [data.event];
                if (data.events && data.event) {
                    eventsToUnregister.push(data.event);
                }
                eventsToUnregister = Array.from(new Set(eventsToUnregister));

                eventsToUnregister.forEach((event: string) => {
                    if (global.eventRegistrars[uID]?.some(reg => reg.event === event)) {
                        global.eventRegistrars[uID] = global.eventRegistrars[uID].filter(reg => reg.event !== event);
                        console.log(`[WS] User ${uID} unregistered from event: ${event}`);
                    } else {
                        console.log(`[WS] User ${uID} attempted to unregister from an event they are not registered for: ${event}`);
                        return client.send(JSON.stringify({error: "Not registered for event", nonce}));
                    }
                })
                return client.send(JSON.stringify({type: "unregistered", events: eventsToUnregister, nonce}));
            default:
                break
        }

        const connId = data.id;
        const conn = global.connections.find(conn => conn.id === connId)
        if (!conn) {
            console.log(`[WS] User ${uID} requested data from non-existent connection: ${connId}`);
            return client.send(JSON.stringify({error: "Connection not found", connId, nonce}));
        }

        switch (data.type) {
            case "registerAsViewer":
                if (!conn.cam) {
                    console.log(`[WS] User ${uID} requested registerAsViewer from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                if (isViewer) {
                    console.log(`[WS] User ${uID} attempted to register as a viewer multiple times`);
                    return client.send(JSON.stringify({error: "Already registered as a viewer", connId, nonce}));
                }

                isViewer = true;
                conn.cam.viewers++

                global.events.emit("viewerUpdate", {id: connId, count: conn.cam.viewers});

                console.log(`[WS] User ${uID} registered as a viewer: ${connId}`);

                client.send(JSON.stringify({type: "ok", connId, nonce}));
                break;
            case "claimControl":
                if (!conn.car) {
                    console.log(`[WS] User ${uID} requested claimControl from non-car connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a car"}));
                }

                if (conn.car?.inControlBy) {
                    console.log(`[WS] User ${uID} requested claimControl from car already in control: ${connId}`);
                    return client.send(JSON.stringify({error: "Car already in control", connId, nonce}));
                }

                conn.car.inControlBy = uID;
                console.log(`[WS] User ${uID} claimed control of car: ${connId}`);
                global.events.emit("carClaimed", {id: connId});
                client.send(JSON.stringify({type: "claimed", connId, nonce}));
                break;
            case "query":
                const query = data.query;


                if (query == "streaming") {
                    if (!conn.cam) {
                        console.log(`[WS] User ${uID} requested streaming status from non-camera connection: ${connId}`);
                        return client.send(JSON.stringify({error: "Connection is not a camera", connId, nonce}));
                    }

                    console.log(`[WS] User ${uID} requested streaming status: ${conn.cam.isLive}`);
                    return client.send(JSON.stringify({type: "streaming", streaming: conn.cam.isLive, connId, nonce}));
                } else if (query == "isClaimed") {
                    if (!conn.car) {
                        console.log(`[WS] User ${uID} requested isClaimed status from non-car connection: ${connId}`);
                        return client.send(JSON.stringify({error: "Connection is not a car", connId, nonce}));
                    }

                    console.log(`[WS] User ${uID} requested isClaimed status: ${!!conn.car.inControlBy}`);
                    return client.send(JSON.stringify({type: "isClaimed", claimed: !!conn.car.inControlBy, connId, nonce}));
                } else if (query == "isCoolingDown") {
                    if (!conn.car) {
                        console.log(`[WS] User ${uID} requested isCoolingDown status from non-car connection: ${connId}`);
                        return client.send(JSON.stringify({error: "Connection is not a car", connId, nonce}));
                    }

                    console.log(`[WS] User ${uID} requested isCoolingDown status: ${conn.car.coolingDown}`);
                    return client.send(JSON.stringify({type: "isCoolingDown", coolingDown: conn.car.coolingDown ?? false, connId, nonce}));
                } else if (query == "viewers") {
                    if (!conn.cam) {
                        console.log(`[WS] User ${uID} requested viewers from non-camera connection: ${connId}`);
                        return client.send(JSON.stringify({error: "Connection is not a camera", connId, nonce}));
                    }

                    console.log(`[WS] User ${uID} requested viewers: ${conn.cam.viewers}`);
                    return client.send(JSON.stringify({type: "viewers", viewers: conn.cam.viewers ?? 0, connId, nonce}));
                }

                const allowedQueries = conn.type=="car"?
                ["status", "battery"] :
                ["status", "battery", "getInfo", "getStatusValues"];
                if (!allowedQueries.includes(query)) {
                    console.log(`[WS] User ${uID} requested invalid query: ${query}`);
                    return client.send(JSON.stringify({error: "Invalid query", connId, nonce}));
                }

                conn.connection.sendAndAwait({type: query}).then((response: any) => {
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending query "${query}" by ${uID} to ${connId}: ${error}`);
                    client.send(JSON.stringify({error: "Error sending query", connId, nonce}));
                })
                break;
            case "wake":
                if (!conn.cam) {
                    console.log(`[WS] User ${uID} requested wake from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                conn.connection.sendAndAwait({type: "wake"}, 120000).then((response: any) => {
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'wake' by ${uID} to ${connId}: ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'wake'", connId, nonce}));
                })
                break;

            case "keepAlive":
                if (!conn.cam) {
                    console.log(`[WS] User ${uID} requested keepAlive from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                conn.connection.send(JSON.stringify({type: "keepAlive", enabled: data.enabled}));
                break;
            case "restartStream":
                global.events.emit("camStreamRestart", {id: connId});
                // stop the broadcast with stopBroadcast, wait a few seconds, then start the broadcast with startStream, by not using the break statement, the code will continue to the next case
                await conn.connection.sendAndAwait({type: "stopBroadcast"}).catch((error: string) => {
                    console.log(`[WS] Error sending 'stopBroadcast' by ${uID} to ${connId}: ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'stopBroadcast'", connId, nonce}));
                })
                if (conn.cam) conn.cam.isLive = false;
                await sleep(5000)
            
            case "connectToWiFi":
                await conn.connection.sendAndAwait({type: "connectToWiFi"}, 30000).then((response: any) => {
                    if (response.error) {
                        console.log(`[WS] Error sending 'connectToWiFi' by ${uID} to ${connId}: ${response.error}`);
                        client.send(JSON.stringify({error: "Error sending 'connectToWiFi'", connId, nonce}));
                    } else {
                        if (data.type !== "restartStream") {
                            client.send(JSON.stringify({...response, connId, nonce}));
                        }
                    }
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'connectToWiFi' by ${uID} to ${connId}: ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'connectToWiFi'", connId, nonce}));
                })

                
                if (data.type !== "restartStream") break;
            case "startStream":
                if (!conn.cam) {
                    console.log(`[WS] User ${uID} requested startStream from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                await conn.connection.sendAndAwait({type: "startBroadcast", url:(await getRtmpUrl(conn?.cam?.ssid)).url, options: {
                    encode: false,
                    windowSize: "WINDOW_SIZE_480",
                    lens: "LENS_SUPERVIEW"
                } as any}, 45000).then((response: any) => {
                    if (conn.cam) conn.cam.isLive = true;
                    if (data.type == "restartStream") global.events.emit("camStreamRestartComplete", {id: connId});
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'startStream' by ${uID} to ${connId}: ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'startStream'", connId, nonce}));
                })
                break;
            case "claimControl":
                if (!conn.cam) {
                    console.log(`[WS] User ${uID} requested claimControl from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                conn.connection.sendAndAwait({type: "claimControl", external: data.external ?? true}, 30000).then((response: any) => {
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'claimControl' by ${uID} to ${connId}: ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'claimControl'", connId, nonce}));
                })
                break;
            case "stabilization":
                if (!conn.cam) {
                    console.log(`[WS] User ${uID} requested stabilization from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                conn.connection.sendAndAwait({type: "stabilization", enabled: data.enabled ?? true}, 30000).then((response: any) => {
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'stabilization' by ${uID} to ${connId}: ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'stabilization'", connId, nonce}));
                })
                break;

            case "setWheelAngle":
                if (!conn.car) {
                    console.log(`[WS] User ${uID} requested setWheelAngle from non-car connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a car"}));
                }

                console.log(data);
                conn.connection.send({type: "setWheelAngle", angle: data.angle})
                break;
            case "setSpeed":
                if (!conn.car) {
                    console.log(`[WS] User ${uID} requested setWheelAngle from non-car connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a car"}));
                }

                console.log(data);
                conn.connection.send({type: "setSpeed", amount: data.amount})
                break;
            case "stop":
            case "move":
                if (!conn.car) {
                    console.log(`[WS] User ${uID} requested move/stop from non-car connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a car"}));
                }
                const type = data.type;
                delete data.type;
                delete data.id;
                conn.connection.send({type: type, data })
                break;
            case "alert":
                if (!conn.cam) {
                    console.log(`[WS] User ${uID} requested alert from non-camera connection: ${connId}`);
                    return client.send(JSON.stringify({error: "Connection is not a camera"}));
                }

                conn.connection.sendAndAwait({type: "alert", message: data.message}, 30000).then((response: any) => {
                    client.send(JSON.stringify({...response, connId, nonce}));
                }).catch((error: string) => {
                    console.log(`[WS] Error sending 'alert' by ${uID} to ${connId}: ${error}`);
                    client.send(JSON.stringify({error: "Error sending 'alert'", connId, nonce}));
                })

                break;
            default:
                console.log(`[WS] Unknown message type by ${uID}: ${data.type}`);
                console.log(data);
                break;
        }

    })
    client.send(JSON.stringify({type: "ready"}));
  }

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}