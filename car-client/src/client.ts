import { config } from "dotenv";
import { parse } from "jsonc-parser";
import { readFileSync } from "fs";
import axios from "axios";
import path from "path";
import { WebSocket } from "ws";
import CarClient from "./lib/car.js";
import si from "systeminformation";

declare const global: CarClientGlobal;


global.config = parse(readFileSync("./config.jsonc", { encoding: "utf-8" }));
let isConnected = false;

if (global.config.DEVELOPMENT) {
    config({path: "./.env.development"});
} else {
    config({path: "./.env.production"});
}

const car = new CarClient(global.config.TECHNIC_MAC, true);

let socket: WebSocket;

car.events.on("ready", () => {
    console.log("Car ready");
    isConnected = true;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        socket = new WebSocket(process.env.WS_URL);
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

        const willReconnect = code !== 1000 && reason.toString("utf-8") !== "Car disconnected from client";
        console.log(`Connection closed: ${code} ${reason}.${willReconnect ? " Reconnecting in 30 seconds..." : ""}`);
        if (willReconnect) {
            setTimeout(() => {
                socket = new WebSocket(process.env.WS_URL);
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
        default:
            break;
    }
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

