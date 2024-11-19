import { LTPGlobal } from "@/interfaces/global";
import crypto from "crypto";
declare const global: LTPGlobal;
export async function getRtmpUrl(ssid: string): Promise<string> {
    const expiryTime = Math.floor(Date.now() + 5 * 60 / 1000)
    return `rtmp://${process.env.HOST}/remote-live/${ssid}?sign=${expiryTime}-${crypto.createHash('md5').update(`/remote-live/${ssid}-${expiryTime}-${global.rtmpSecret}`).digest("hex")}`
}