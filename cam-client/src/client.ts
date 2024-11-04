import { config } from "dotenv";
import { parse } from "jsonc-parser";
import { readFileSync } from "fs";
import axios from "axios";
import path from "path";
import { WebSocket } from "ws";
import GoProClient from "./lib/gopro.js";
import si from "systeminformation"

declare const global: CamClientGlobal;


global.config = parse(readFileSync("./config.jsonc", { encoding: "utf-8" }));
let isConnected = false;

let isBusy = false;
let msgQueue = [

]

if (global.config.DEVELOPMENT) {
    config({path: "./.env.development"});
} else {
    config({path: "./.env.production"});
}

const camera = new GoProClient(global.config.CAMERA_MAC, true);

let socket: WebSocket;

camera.events.on("ready", () => {
    console.log("Camera ready");
    isConnected = true;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        socket = new WebSocket(process.env.WS_URL);
        registerHandlers();
    }
})

camera.events.on("disconnect", (data) => {
    console.log(`Camera disconnected${data.isSleeping ? ", the user put it to sleep.":""}`);
    isConnected = false;
    //! Do not close the connection if the user put the camera to sleep, this is so that the camera can be woken up by the server
    if (socket.readyState === WebSocket.OPEN && !data.isSleeping) {
        socket.close(1000, "Camera disconnected from client");
    }
})

await camera.connect();




function registerHandlers() {
    socket.on("open", () => {
        console.log("Connected to WebSocket server");
    });

    socket.on("error", (error) => {
        console.error(error);
        console.log("Reconnecting in 30 seconds...");
        setTimeout(() => {
            socket = new WebSocket(process.env.WS_URL);
        }, 30000);
    })

    socket.on("close", (code, reason) => {

        const willReconnect = code !== 1000 && reason.toString("utf-8") !== "Camera disconnected from client";
        console.log(`Connection closed: ${code} ${reason}.${willReconnect ? " Reconnecting in 30 seconds..." : ""}`);
        if (willReconnect) {
            setTimeout(() => {
                socket = new WebSocket(process.env.WS_URL);
            }, 30000);
        }
    })

    socket.on("message", parseMessage);
    setInterval(processQueue, 100);
}


async function parseMessage(message: string) {
    try {
        const data = JSON.parse(message);
        
        if (isBusy) {
            console.log("Camera is busy, adding message to queue:", data);
            msgQueue.push(data);
            return;
        }
        
        isBusy = true;
        await processMessage(data);
        isBusy = false;
    } catch (error) {
        console.warn(`Error parsing message: ${error}`);
    }
}


async function processQueue() {
    if (!isBusy) {
        const next = msgQueue.shift();
        if (next) {
            console.log("Processing next message in queue ("+msgQueue.length+" remain):", next);
            isBusy = true;
            await processMessage(next);
            isBusy = false;
        }
    }
}

async function processMessage(data: any) {
    console.log("Processing message:", data);
    if (!isConnected) {
        if (!camera.isSleeping) {
            return socket.send(JSON.stringify({error: "Camera not connected", nonce: data.nonce}));
        } else {
            if (!["system", "status", "wake"].includes(data.type)) { 
                await camera.wake();
            }
        }
    }



    switch (data.type) {
        case "identify":
            await sendIdentification(data.nonce);
            break;
        case "getInfo":
            await getInfo(data.nonce);
            break;
        case "status":
            await sendStatus(data.nonce);
            break;
        case "battery":
            await sendBatteryLevel(data.nonce);
            break;
        case "startBroadcast":
            await startBroadcast(data);
            await sleep(2000)
            await sendOK(data.nonce);
            break;
        case "stopBroadcast":
            await stopBroadcast();
            await sleep(2000)
            await sendOK(data.nonce);
            break;
        case "connectToWiFi":
            await connectToWiFi(data.nonce, data);
            break;
        case "sleep":
            await camera.sleep();
            await sendOK(data.nonce);
            break;
        case "powerOff":
            await camera.powerOff();
            await sendOK(data.nonce);
            break;
        case "getStatusValues":
            await camera.getStatusValues();
            const resp = await camera.waitForTlvResponse("17")

            socket.send(JSON.stringify({type: "statusValues", data: resp, nonce: data.nonce}));
            break;
        case "wake":
            while (!isConnected) {
                await camera.wake();
                await sleep(1000);
            }
            await sendOK(data.nonce);
            break;
        case "keepAlive":
            await camera.toggleKeepAlive(data.enabled ?? true)
            await sendOK(data.nonce);
            break;
        case "system":
            socket.send(JSON.stringify({type: "system", model: await getModel(), hostname: await getHostname(), os: await getSystemOSName(), nonce: data.nonce}));
            break;
        default:
            break;
    }

    console.log("Message processed");
}

async function sendStatus(nonce: string) {
    socket.send(JSON.stringify({type: "status", connected: isConnected, sleeping: !isConnected && camera.isSleeping, nonce}));
}

async function sendBatteryLevel(nonce: string) {
    const batteryLevel = isConnected ? await camera.getBatteryLevel() : 0;
    socket.send(JSON.stringify({type: "battery", level: batteryLevel, nonce}));
}

async function sendIdentification(nonce: string) {
    const info = await getCameraInformation();
    return socket.send(JSON.stringify({type: "identify", ...info, nonce}));
}

async function getInfo(nonce: string) {
    const info = await getCameraInformation();
    return socket.send(JSON.stringify({type: "getInfo", ...info, nonce}));
}


async function getCameraInformation() {
    const info = await camera.getInfo();
    const wifiInfo = await camera.getOwnAPInfo();
    delete info.batteryLevel;
    delete wifiInfo.password;
    return {...info, ...wifiInfo};
}

async function sendOK(nonce: string) {
    socket.send(JSON.stringify({type: "ok", nonce}));
}

async function startBroadcast(data: any) {
    if (data.url) {
        console.log("preparing to start broadcast", data)
        await camera.setLiveStreamMode({
            url: data.url,
            ...data.options
        });
        console.log("awaiting acknoledgement");
        await camera.waitForProtoResponse("F1", "F9") // Wait for acknowledgement
        console.log("Camera is now ready to stream");
        await sleep(5000);
        console.log("starting capture");
        await camera.startCapture();
        console.log("stared capture");
    }
}

async function stopBroadcast() {
    await camera.stopCapture();
}

async function getSystemOSName() {
    try {
        return readFileSync("/etc/os-release", {encoding: "utf-8"}).match(/PRETTY_NAME="(.*)"/)[1];
    } catch (e) {
        return "Unknown";
    }
}
 
async function getModel() {
    try {
        return readFileSync("/proc/device-tree/model", {encoding: "utf-8"});
    } catch (e) {
        try {
            return (await si.system()).model;
        } catch (e) {
            return "Unknown";
        }   
    }
}

async function getHostname() {
    try {
        return readFileSync("/etc/hostname", {encoding: "utf-8"});
    } catch (e) {
        return "Unknown";
    }
}

async function connectToWiFi(nonce: string, data) {
    await camera.scanAvailableAPs()
    
    let scanId	= null;
    let totalEntries = 0
    const response = await camera.waitForProtoResponse("02", "0B")
    if (response.scanningState == 5 || response.scanningState == "SCANNING_SUCCESS") {
        scanId = response.scanId
        totalEntries = response.totalEntries
    } else {
        socket.send(JSON.stringify({error: "Scanning failed", nonce}))
        return
    }
    
    await camera.getAPResults(scanId, totalEntries)
    const ap = (await camera.waitForProtoResponse("02", "83")).entries.find((a: any) => a.ssid == data.ssid)
    
    if (!ap) {
        socket.send(JSON.stringify({error: "AP not found", nonce}))
        return
    }
    
    // not connected
    if ((8 & ap.scanEntryFlags) != 8) {
        // not saved
        if ((2 & ap.scanEntryFlags) != 2) {
            await camera.connectToNewAP(data.ssid, Buffer.from(data.password, "base64").toString("utf-8"))
        } else {
            await camera.connectToConfiguredAP(data.ssid)
        }
    
            const response = await camera.waitForProtoResponse("02", "0C")
            if (response.provisioningState != 5 && response.provisioningState != 6 && response.provisioningState != "PROVISIONING_SUCCESS_NEW_AP" && response.provisioningState != "PROVISIONING_SUCCESS_OLD_AP") {
                const provisioningStateMap = {
                    "0": "PROVISIONING_UNKNOWN",	
                    "1": "PROVISIONING_NEVER_STARTED",	
                    "2": "PROVISIONING_STARTED",	
                    "3": "PROVISIONING_ABORTED_BY_SYSTEM",	
                    "4": "PROVISIONING_CANCELLED_BY_USER",
                    //! 5 and 6 are success
                    "7": "PROVISIONING_ERROR_FAILED_TO_ASSOCIATE",	
                    "8": "PROVISIONING_ERROR_PASSWORD_AUTH",	
                    "9": "PROVISIONING_ERROR_EULA_BLOCKING",	
                    "10": "PROVISIONING_ERROR_NO_INTERNET",	
                    "11": "PROVISIONING_ERROR_UNSUPPORTED_TYPE"
                }

                socket.send(JSON.stringify({error: provisioningStateMap[response.provisioningState], nonce}))
                return
            }
    }

    await sendOK(nonce)
}

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

