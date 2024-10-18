import { config } from "dotenv";
import { parse } from "jsonc-parser";
import { readFileSync } from "fs";
import axios from "axios";
import path from "path";
import { WebSocket } from "ws";
import GoProClient from "./lib/gopro.js";

declare const global: CamClientGlobal;


global.config = parse(readFileSync("./config.jsonc", { encoding: "utf-8" }));
let isConnected = false;

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
            registerHandlers();
        }, 30000);
    })

    socket.on("close", (code, reason) => {

        const willReconnect = code !== 1000 && reason.toString("utf-8") !== "Camera disconnected from client";
        console.log(`Connection closed: ${code} ${reason}.${willReconnect ? " Reconnecting in 30 seconds..." : ""}`);
        if (willReconnect) {
            setTimeout(() => {
                socket = new WebSocket(process.env.WS_URL);
                registerHandlers();
            }, 30000);
        }
    })

    socket.on("message", parseMessage);
}


async function parseMessage(message: string) {
    try {
        const data = JSON.parse(message);
        processMessage(data);
    } catch (error) {
        console.warn(`Error parsing message: ${error}`);
    }
}

async function processMessage(data: any) {
    if (!isConnected) {
        if (!camera.isSleeping || data.type != "wake") {
            return socket.send(JSON.stringify({error: "Camera not connected"}));
        }
    }
    switch (data.type) {
        case "identify":
            await sendIdentification();
            break;
        case "status":
            await sendStatus();
            break;
        case "battery":
            await sendBatteryLevel();
            break;
        case "startBroadcast":
            await startBroadcast(data);
            await sendOK();
            break;
        case "stopBroadcast":
            await stopBroadcast();
            await sendOK();
            break;
        case "connectToWiFi":
            await connectToWiFi(data);
            break;
        case "sleep":
            await camera.sleep();
            await sendOK();
            break;
        case "powerOff":
            await camera.powerOff();
            await sendOK();
            break;
        case "wake":
            await camera.wake();
            await sendOK();
            break;
        case "keepAlive":
            await camera.toggleKeepAlive(data.enabled ?? true)
            await sendOK();
            break;
        default:
            break;
    }
}

async function sendStatus() {
    socket.send(JSON.stringify({type: "status", connected: isConnected, sleeping: !isConnected && camera.isSleeping}));
}

async function sendBatteryLevel() {
    const batteryLevel = isConnected ? await camera.getBatteryLevel() : 0;
    socket.send(JSON.stringify({type: "battery", level: batteryLevel}));
}

async function sendIdentification() {
    const info = await camera.getInfo();
    delete info.batteryLevel;
    socket.send(JSON.stringify({type: "identify", ...info}));
}

async function sendOK() {
    socket.send(JSON.stringify({type: "ok"}));
}

async function startBroadcast(data: any) {
    if (data.url) {
        await camera.setLiveStreamMode({
            url: data.url,
            ...data.options
        });
        await camera.waitForProtoResponse("F1", "F9") // Wait for acknowledgement
        await sleep(2000);
        await camera.startCapture();
    }
}

async function stopBroadcast() {
    await camera.stopCapture();
}

async function connectToWiFi(data) {
    await camera.scanAvailableAPs()
    
    let scanId	= null;
    let totalEntries = 0
    const response = await camera.waitForProtoResponse("02", "0B")
    if (response.scanningState == 5) {
        scanId = response.scanId
        totalEntries = response.totalEntries
    } else {
        socket.send(JSON.stringify({error: "Scanning failed"}))
        return
    }
    
    await camera.getAPResults(scanId, totalEntries)
    const ap = (await camera.waitForProtoResponse("02", "83")).entries.find((a: any) => a.ssid == data.ssid)
    
    if (!ap) {
        socket.send(JSON.stringify({error: "AP not found"}))
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
            if (response.provisioningState != 5 && response.provisioningState != 6) {
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

                socket.send(JSON.stringify({error: provisioningStateMap[response.provisioningState]}))
                return
            }
    }

    await sendOK()
}

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

