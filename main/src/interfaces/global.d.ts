import { InimizedWS } from "@/utils/ws";
import NodeMediaServer from "node-media-server";
import { EventEmitter } from "stream";

interface LTPGlobal extends NodeJS.Global {
    nms: NodeMediaServer | null,
    connections: {
            id: string,
            type: "cam" | "car" | "user",
            cam?: {
                name: string,
                MACAddress: string,
                modelNumber: string,
                firmwareVersion: string
                serialNumber: string,
                ssid: string,
                isLive: boolean;
            },
            car?: {
                name: string,
                MACAddress: string,
                firmwareVersion: string,
                hardwareVersion: string,
                cameraSerial: string,
                inControlBy: null | string,
                coolingDown: boolean,
            },
            system?: {
                model: string,
                hostname: string,
                os: string
            },
            ready: boolean,
            connection: InimizedWS,
        }[],
    rtmpSecret: string,
    events: EventEmitter,
    eventRegistrars: {
        [key: string]: {
            event: string,
            callback: (...args: any[]) => void
        }[]
    },
    validEvents: stirng[]
} 