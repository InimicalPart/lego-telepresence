import NodeMediaServer from "node-media-server";

interface LTPGlobal extends NodeJS.Global {
    nms: NodeMediaServer | null,
    connections: {
            id: string,
            type: "cam" | "car",
            cam?: {
                name: string,
                modelNumber: string,
                serialNumber: string,
                firmwareRevision: string
            },
            car?: {
                name: string,
            },
            connection: import("ws").WebSocket,
        }[]
}