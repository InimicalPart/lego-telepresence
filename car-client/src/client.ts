import { config } from "dotenv";
import { parse } from "jsonc-parser";
import { readFileSync } from "fs";
import axios from "axios";
import path from "path";
import { WebSocket } from "ws";
import CarClient from "./lib/car.js";

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
    //! Do not close the connection if the user put the camera to sleep, this is so that the camera can be woken up by the server
    if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Car disconnected from client");
        socket.terminate()
    }
})

await car.connect();




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

        const willReconnect = code !== 1000 && reason.toString("utf-8") !== "Car disconnected from client";
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
        return socket.send(JSON.stringify({error: "Car not connected"}));
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
        default:
            break;
    }
}

async function sendStatus() {
}

async function sendBatteryLevel() {
}

async function sendIdentification() {
    const info = await car.getInfo();
    delete info.batteryLevel;
    socket.send(JSON.stringify({type: "identify", ...info, ...(global.config.CAMERA_SN ? {cameraSerial: global.config.CAMERA_SN} : {})}));
}

async function sendOK() {
    socket.send(JSON.stringify({type: "ok"}));
}

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

