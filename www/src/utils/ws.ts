import { LTPGlobal } from "@/interfaces/global";
import { WebSocket } from "ws";

declare const global: LTPGlobal;

export async function generateWSID() {
    function getID() {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < 16; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result
    }


    let result = getID();
    while (global.connections.some(conn => conn.id === result)) {
        result = getID();
    }
    return result;
}

export function generateNonce() {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < 32; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result
}

export type InimizedWS = WebSocket & { send: (data: any, options?: any, cb?: ((err?: Error) => void) | undefined) => string; sendAndAwait: (data: any, timeout?: number) => Promise<any>; }

export async function inimizeWSClient(wsClient: any): Promise<InimizedWS> {
    const oldSend = wsClient.send;

    wsClient.send =  (data: any, options?: any, cb?: ((err?: Error) => void) | undefined) => {

        const nonce =  generateNonce();
        try {
            
            if (typeof data == "string") {
                const dataJSON = JSON.parse(data);
                dataJSON.nonce = nonce;
                data = JSON.stringify(dataJSON);
            } else if (typeof data == "object") {
                data.nonce = nonce;
                data = JSON.stringify(data);
            } else {
                console.warn(`[WS] Attempted to add nonce to invalid data type: ${typeof data}`);
            }
        } catch (e) {
            console.warn(`[WS] Error adding nonce: ${e}`);
        }


        if (typeof options === 'function') {
            cb = options;
            options = undefined;
        }
        oldSend.call(wsClient, data, options, cb);
        return nonce;
    }

    wsClient.sendAndAwait = async (data: any, timeout: number = 5000) => {
        const nonce = wsClient.send(data);
        return new Promise((resolve, reject) => {
            const timeoutID = setTimeout(() => {
                reject("Timeout");
            }, timeout);

            function onMessage(message: string) {
                try {
                    const messageJSON = JSON.parse(message);
                    if (messageJSON.nonce === nonce) {
                        clearTimeout(timeoutID);
                        wsClient.off('message', onMessage);
                        resolve(messageJSON);
                    }
                } catch (e) {
                    console.warn(`[WS] Error parsing response: ${e}`);
                }
            }

            wsClient.on('message', onMessage)
        })
    }

    return wsClient;
}

