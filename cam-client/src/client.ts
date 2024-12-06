/*
 * Copyright (c) 2024 Inimi | InimicalPart
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { config } from "dotenv";
import { parse } from "jsonc-parser";
import { existsSync, readFileSync } from "fs";
import axios from "axios";
import path from "path";
import { WebSocket } from "ws";
import GoProClient from "./lib/gopro.js";
import si from "systeminformation"
import { execSync } from "child_process";
import * as jose from "jose"
declare const global: CamClientGlobal;


const isDev = existsSync("./config-dev.jsonc")

global.config = parse(readFileSync(isDev?"./config-dev.jsonc":"./config.jsonc", { encoding: "utf-8" }));
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
let keepAliveEnabled = false;
let keepAliveInterval: NodeJS.Timeout = setInterval(()=>{
    if (keepAliveEnabled && isConnected) {
        parseMessage(JSON.stringify({type: "sendKeepAlive"}))
    }
}, 3000);
let socket: WebSocket;
let connAPIKey: string;

camera.events.on("ready", async () => {
    console.log("Camera ready");
    isConnected = true;
    if (!socket || socket?.readyState !== WebSocket.OPEN) {
        connAPIKey = await generateAccessoryAPIKey();
        socket = new WebSocket(process.env.WS_URL, { headers: {authorization: "Bearer " + connAPIKey}});
        registerHandlers();
    }
})

camera.events.on("disconnect", (data) => {
    console.log(`Camera disconnected${data.isSleeping ? ", the user put it to sleep.":""}`);
    isConnected = false;
    //! Do not close the connection if the user put the camera to sleep, this is so that the camera can be woken up by the server
    if (socket?.readyState === WebSocket.OPEN && !data.isSleeping) {
        socket.close(1000, "Camera disconnected from client");
    }
})

await camera.connect();


async function generateAccessoryAPIKey() {
    return await new jose.SignJWT({type:"cam"})
    .setProtectedHeader({
        alg: 'HS256'
    })
    .setIssuedAt("-1m")
    .setIssuer('inimi:ltp-accessory')
    .setAudience('inimi:ltp-accessory')
    .sign(new TextEncoder().encode(
        process.env.ACCESSORY_SECRET ?? "8badf00db105f00d0d15ea5e8badf00db105f00d0d15ea5e8badf00db105f00d0d15ea5e8badf00db105f00d0d15ea5e8badf00db105f00d0d15ea5e8badf00d"
    ));
}

function registerHandlers() {
    socket.on("open", () => {
        console.log("Connected to WebSocket server");
    });

    socket.on("error", (error) => {
        console.error(error);
        console.log("Reconnecting in 30 seconds...");
        setTimeout(async () => {
            connAPIKey = await generateAccessoryAPIKey();
            socket = new WebSocket(process.env.WS_URL, { headers: {authorization: "Bearer " + connAPIKey}});
        }, 30000);
    })

    socket.on("close", (code, reason) => {

        console.log(`Connection closed: ${code} ${reason}. Reconnecting in 30 seconds...`);
        setTimeout(async () => {
            connAPIKey = await generateAccessoryAPIKey();
            socket = new WebSocket(process.env.WS_URL, { headers: {authorization: "Bearer " + connAPIKey}});
            registerHandlers();
        }, 30000);
    })

    socket.on("message", parseMessage);
    setInterval(processQueue, 100);
}


async function parseMessage(message: string) {
    console.log(typeof message, message)
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
        console.warn((error as TypeError).stack);
        isBusy = false;
    }
}


async function processQueue() {
    if (!isBusy) {

        if (msgQueue.filter(m => m.type == "sendKeepAlive").length > 1) {
            const indexOfFirstKeepAlive = msgQueue.findIndex(m => m.type == "sendKeepAlive")
            
            msgQueue = msgQueue.filter(m => m.type !== "sendKeepAlive")
            msgQueue.splice(indexOfFirstKeepAlive, 0, {type: "sendKeepAlive"})
        }

        const next = msgQueue.shift();
        if (next) {

            if (next.type == "sleep") {
                msgQueue = []
            }

            console.log("Processing next message in queue ("+msgQueue.length+" remain):", next);
            isBusy = true;
            await processMessage(next);
            isBusy = false;
        }
    }
}

async function randomString(length: number) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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


            await camera.getStatusValues();
            let statusValuesResponse = Buffer.from(await camera.waitForTlvResponse("13"), "hex");
            const statusValuesParsed = await parseStatusValues(statusValuesResponse) as any

            if (!data.ssid && !data.password) {
                const net = await getConnectedWiFi();

                data.ssid = net.ssid;
                data.password = net.psk;
            }

            if (data.ssid != statusValuesParsed.connectedAP) {
                const success = await connectToWiFi(data);
                if (success) {
                    await sendOK(data.nonce)
                } else {
                    socket.send(JSON.stringify({error: "Failed to connect to WiFi", nonce: data.nonce}));
                }
            } else {
                await sendOK(data.nonce)
            }
            break;
        case "sleep":
            keepAliveEnabled = false
            msgQueue = []
            await sleep(100)
            await camera.sleep();
            await sendOK(data.nonce);
            break;
        case "powerOff":
            keepAliveEnabled = false
            msgQueue = []
            await sleep(100)
            await camera.powerOff();
            await sendOK(data.nonce);
            break;
        case "getStatusValues":
            await camera.getStatusValues();
            let resp = Buffer.from(await camera.waitForTlvResponse("13"), "hex");
            socket.send(JSON.stringify({type: "statusValues", data: await parseStatusValues(resp), nonce: data.nonce}));
            break;
        case "wake":
            while (!isConnected) {
                await camera.wake();
                await sleep(1000);
            }
            await sendOK(data.nonce);
            break;
        case "keepAlive":
            keepAliveEnabled = data.enabled ?? true
            await sendOK(data.nonce);
            break;
        case "system":
            socket.send(JSON.stringify({type: "system", model: await getModel(), hostname: await getHostname(), os: await getSystemOSName(), nonce: data.nonce}));
            break;
        case "claimControl":
            await camera.claimControl(data.external);
            await sendOK(data.nonce);
            break;
        case "sendKeepAlive":
            await camera.sendKeepAlive();
            break;
        case "stabilization":
            await camera.setStabilization(data.enabled ?? true);
            await sendOK(data.nonce);
            break;
        case "alert":
            await camera.locate(true);
            await sleep(500)
            await camera.locate(false);
            await sendOK(data.nonce);
            break;
        default:
            break;
    }

    console.log("Message processed");
}

async function parseStatusValues(resp: Buffer) {

    const finalDict = {}

    while (resp.length > 0) {
        //STATUS_ID (2 bytes)
        //LENGTH (2 bytes)
        //VALUE (LENGTH bytes)

        const STATUS_ID = resp.subarray(0, 1)
        const LENGTH = resp.subarray(1, 2)
        const VALUE = resp.subarray(2, 2 + parseInt(LENGTH.toString("hex"), 16));
    
        switch (STATUS_ID.toString("hex").toUpperCase()) {
            case "1D":
                //* Connected AP Name
                finalDict["connectedAP"] = VALUE.toString("utf-8");
                break;
            default:
                console.warn("Unknown status ID:", STATUS_ID.toString("hex").toUpperCase());
                break;
            
        }

        const removeLength = 2 + parseInt(LENGTH.toString("hex"), 16);
        resp = resp.subarray(removeLength);
    }

    return finalDict;
}

async function getConnectedWiFi() {
    const whoami = execSync("whoami").toString().trim();
    const stdout = execSync(`${whoami=="lowpriv"?"sudo ":""}nmcli -t -c no device wifi show-password`);
    const lines = stdout.toString().split("\n");

    const ssid = lines.find((line) => line?.toUpperCase()?.startsWith("SSID"))?.split(":")?.[1]?.trim();
    const psk = lines.find((line) => line?.toUpperCase()?.startsWith("PASSWORD"))?.split(":")?.[1]?.trim();

    return {ssid, psk};
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
        await camera.setLiveStreamMode({
            url: data.url,
            ...data.options
        });
        await camera.waitForProtoResponse("F1", "F9") // Wait for acknowledgement
        await sleep(5000);
        await camera.startCapture();
    }
}

async function stopBroadcast() {
    await camera.stopCapture();
}

async function getSystemOSName() {
    try {
        return readFileSync("/etc/os-release", {encoding: "utf-8"})?.match(/PRETTY_NAME="(.*)"/)[1]?.trim();
    } catch (e) {
        return "Unknown";
    }
}
 
async function getModel() {
    try {
        return readFileSync("/proc/device-tree/model", {encoding: "utf-8"})?.trim();
    } catch (e) {
        try {
            return (await si.system()).model?.trim();
        } catch (e) {
            return "Unknown";
        }   
    }
}

async function getHostname() {
    try {
        return readFileSync("/etc/hostname", {encoding: "utf-8"})?.trim();
    } catch (e) {
        return "Unknown";
    }
}

async function connectToWiFi(data) {
    await camera.scanAvailableAPs()
    
    let scanId	= null;
    let totalEntries = 0
    const response = await camera.waitForProtoResponse("02", "0B")
    if (response.scanningState == 5 || response.scanningState == "SCANNING_SUCCESS") {
        scanId = response.scanId
        totalEntries = response.totalEntries
    } else {
        return false
    }
    
    await camera.getAPResults(scanId, totalEntries)
    const ap = (await camera.waitForProtoResponse("02", "83")).entries.find((a: any) => a.ssid == data.ssid)
    
    if (!ap) {
        return false
    }
    
    // not connected
    if ((8 & ap.scanEntryFlags) != 8) {
        // not saved
        console.log(data.ssid, data.password)
        if ((2 & ap.scanEntryFlags) != 2) {
            await camera.connectToNewAP(data.ssid, data.password)
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

                return false
            }
    }

    return true
}

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

