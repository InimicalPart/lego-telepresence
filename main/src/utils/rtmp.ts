import { LTPGlobal } from "@/interfaces/global";
import crypto from "crypto";
declare const global: LTPGlobal;
export async function getRtmpUrl(ssid: string, header: string = "remotelive"): Promise<{url:string,expiresAt:Date}> {
    const expiryTime = Math.floor((Date.now() + (5 * 60 * 1000)) / 1000) 
    return {
        url: `rtmp://${process.env.HOST}/${header}/${ssid}?sign=${expiryTime}-${crypto.createHash('md5').update(`/${header}/${ssid}-${expiryTime}-${global.rtmpSecret}`).digest("hex")}`,
        expiresAt: new Date(expiryTime * 1000)
    }
}