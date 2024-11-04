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
                isLive: any;
            },
            car?: {
                name: string,
                MACAddress: string,
                firmwareVersion: string,
                hardwareVersion: string,
                cameraSerial: string,
            },
            ready: boolean,
            connection: InimizedWS,
        }[],
    events: EventEmitter
} 