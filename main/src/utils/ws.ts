import { LTPGlobal } from "@/interfaces/global";
import { WebSocket } from "ws";
import * as jose from "jose"


declare const global: LTPGlobal;

export async function generateWSID(prefix: string = "") {
    function getID() {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < 16; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result
    }


    let result = prefix + getID();
    while (global.connections.some(conn => conn.id === result)) {
        result = prefix + getID();
    }
    return result;
}

export function generateNonce() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 32; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result
}

export type InimizedWS = WebSocket & { send: (data: string | {[key:string]: string|number|boolean|null}, options?: ((err?: Error) => void) | {[key:string]:string|number|boolean|null}, cb?: ((err?: Error) => void) | undefined) => string; sendAndAwait: (data: string | {[key:string]: string|number|boolean|null}, timeout?: number) => Promise<string | {[key:string]: string|number|boolean|null}>; }

export async function inimizeWSClient(wsClient: any): Promise<InimizedWS> {
    const oldSend = wsClient.send;

    wsClient.send = (data: string | {[key:string]: string|number|boolean|null}, options?: ((err?: Error) => void) | {[key:string]:string|number|boolean|null}, cb?: ((err?: Error) => void) | undefined) => {

        let nonce = generateNonce();
        try {
            
            if (typeof data == "string") {
                const dataJSON = JSON.parse(data);
                if (!dataJSON.nonce) dataJSON.nonce = nonce;
                else nonce = dataJSON.nonce;
                data = JSON.stringify(dataJSON);
            } else if (typeof data == "object") {
                if (!data.nonce) data.nonce = nonce;
                else nonce = String(data.nonce);
                data = JSON.stringify(data);
            } else {
                console.warn(`[WS] Attempted to add nonce to invalid data type: ${typeof data}`);
            }
        } catch (e) {
            console.warn(`[WS] Error adding nonce: ${e}`);
        }


        if (typeof options === 'function') {
            cb = options as (err?: Error) => void;
            options = undefined;
        }
        oldSend.call(wsClient, data, options, cb);
        return nonce;
    }

    wsClient.sendAndAwait = async (data: string | {[key:string]: string|number|boolean|null}, timeout: number = 5000) => {
        let nonce: string|null = null
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
            nonce = wsClient.send(data);

        })
    }

    return wsClient;
}


export async function validateAccessoryAPI(key: string) {
    try {
        const { payload } = await jose.jwtVerify(key, new TextEncoder().encode(
            process.env.ACCESSORY_SECRET ?? "8badf00db105f00d0d15ea5e8badf00db105f00d0d15ea5e8badf00db105f00d0d15ea5e8badf00db105f00d0d15ea5e8badf00db105f00d0d15ea5e8badf00d"
        ), {
            issuer: 'inimi:ltp-accessory',
            audience: 'inimi:ltp-accessory',
            algorithms: ['HS256']
        })
        
        return Date.now() - ((payload.iat ?? 0) *1000) < 1000 * 60 * 5;
    } catch {
        return false;
    }
}