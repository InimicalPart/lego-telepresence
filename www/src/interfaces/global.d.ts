import { InimizedWS } from "@/utils/ws";
import NodeMediaServer from "node-media-server";

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
            },
            car?: {
                name: string,
                MACAddress: string,
                firmwareVersion: string,
                hardwareVersion: string,
                cameraSerial: string,
            },
            connection: InimizedWS,
        }[]
}