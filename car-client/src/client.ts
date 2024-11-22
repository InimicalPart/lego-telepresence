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
import CarClient from "./lib/car.js";
import si from "systeminformation";
import performance from "./lib/performance.js";
import * as jose from "jose"
declare const global: CarClientGlobal;


const isDev = existsSync("./config-dev.jsonc")

global.config = parse(readFileSync(isDev?"./config-dev.jsonc":"./config.jsonc", { encoding: "utf-8" }));
let isConnected = false;

if (global.config.DEVELOPMENT) {
    config({path: "./.env.development"});
} else {
    config({path: "./.env.production"});
}

let messageQueue: any[] = [];
let queueBusy = false;

setInterval(handleQueue, 50);

const car = new CarClient(global.config.TECHNIC_MAC, true);

let socket: WebSocket;
let busy = false;
let connAPIKey: string;
car.events.on("ready", async () => {
    console.log("Car ready");
    isConnected = true;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        connAPIKey = await generateAccessoryAPIKey();
        socket = new WebSocket(process.env.WS_URL, { headers: {authorization: "Bearer " + connAPIKey}});
        registerHandlers();
    }
})

car.events.on("disconnect", () => {
    console.log(`Car disconnected`);
    isConnected = false;
    if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Car disconnected from client");
    }
})

await car.connect().catch(onConnectionFailed)


async function onConnectionFailed(error) {
    console.error("Error connecting to car:", error);
    await car.connect().catch(onConnectionFailed)
}

async function generateAccessoryAPIKey() {
    return await new jose.SignJWT({type:"car"})
    .setProtectedHeader({
        alg: 'HS256'
    })
    .setIssuedAt()
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

        const willReconnect = code !== 1000 && reason.toString("utf-8") !== "Car disconnected from client";
        console.log(`Connection closed: ${code} ${reason}.${willReconnect ? " Reconnecting in 30 seconds..." : ""}`);
        if (willReconnect) {
            setTimeout(async () => {
                connAPIKey = await generateAccessoryAPIKey();
                socket = new WebSocket(process.env.WS_URL, { headers: {authorization: "Bearer " + connAPIKey}});
                registerHandlers();
            }, 30000);
        }
    })

    socket.on("message", parseMessage);
}


async function parseMessage(message: string) {
    try {
        const data = JSON.parse(message);
        messageQueue.push({...data, at: Date.now()});
        console.log(data);

    } catch (error) {
        console.warn(`Error parsing message: ${error}`);
    }
}



async function handleQueue() {
    if (queueBusy) return;

    queueBusy = true;
    performance.start("handleQueue", undefined, {silent:true});
    // if there is a type "stop" in the queue, remove all "move" messages

    if (messageQueue.some((msg) => msg.type === "stop")) {
        messageQueue = messageQueue.filter((msg) => msg.type !== "move");
    }

    // if there are more than 1 "move" messages in the queue, remove all but the last one

    if (messageQueue.filter((msg) => msg.type === "move").length > 1) {
        messageQueue = messageQueue.filter((msg) => msg.type !== "move" || msg.at === messageQueue.filter((msg) => msg.type === "move").sort((a, b) => a.at - b.at)[0].at);
    }
    if (messageQueue.length > 0) {
        performance.end("handleQueue");
        const message = messageQueue.shift();
        performance.start("handleCMD", undefined, {silent:true});
        await processMessage(message);
        performance.end("handleCMD");
    }
    performance.exists("handleQueue") && performance.end("handleQueue", {silent:true});
    queueBusy = false;

}


async function processMessage(data: any) {
    if (!isConnected) {
        return socket.send(JSON.stringify({error: "Car not connected"}));
    }

    switch (data.type) {
        case "identify":
            await sendIdentification(data.nonce);
            break;
        case "status":
            await sendStatus(data.nonce);
            break;
        case "battery":
            await sendBatteryLevel(data.nonce);
            break;
        case "system":
            socket.send(JSON.stringify({type: "system", model: await getModel(), hostname: await getHostname(), os: await getSystemOSName(), nonce: data.nonce}));
            break;
        case "move":
            await handleMove(data);
            break;
        case "stop":
            await handleStop(data);
            break;
        case "setWheelAngle":
            await car.setWheelAngle(data.angle);
            break;
        case "setSpeed":
            await car.move(data.amount);
            break;
        default:
            break;
    }
}

async function handleStop(data: any) {
    await car.realMove("stop", data.data);
}

async function handleMove(data: any) {
    await car.realMove("move", data.data);
}

async function sendStatus(nonce: string) {
    socket.send(JSON.stringify({type: "status", connected: isConnected, nonce}));
}

async function sendBatteryLevel(nonce: string) {
    const batteryLevel = car.getBattery();
    socket.send(JSON.stringify({type: "battery", level: batteryLevel, nonce}));
}

async function sendIdentification(nonce: string) {
    const info = await car.getInfo();
    delete info.batteryLevel;
    socket.send(JSON.stringify({type: "identify", ...info, ...(global.config.CAMERA_SN ? {cameraSerial: global.config.CAMERA_SN} : {}), nonce}));
}

async function sendOK(nonce: string) {
    socket.send(JSON.stringify({type: "ok", nonce}));
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

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

