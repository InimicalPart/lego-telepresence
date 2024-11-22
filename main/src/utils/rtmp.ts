import { LTPGlobal } from "@/interfaces/global";
import crypto from "crypto";
declare const global: LTPGlobal;
export async function getRtmpUrl(ssid: string): Promise<string> {
    const expiryTime = Math.floor((Date.now() + 5 * 60 * 60) / 1000)
    return `rtmp://${process.env.HOST}/remotelive/${ssid}?sign=${expiryTime}-${crypto.createHash('md5').update(`/remotelive/${ssid}-${expiryTime}-${global.rtmpSecret}`).digest("hex")}`
}