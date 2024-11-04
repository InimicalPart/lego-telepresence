"use client";

import { useEffect, useState } from "react";
import MpegTSVideo from "./mpegts-video";

export default function Player({
    width = "300px",
    height = "168.75px",
    cameraId,
    className,
    style,
    foreverMute = false
}: {
    width?: string,
    height?: string,
    cameraId: string|null,
    className?: any,
    style?: any,
    foreverMute?: boolean
}) {


    const [isStreaming, setStreaming] = useState(false)
    const [url, setUrl] = useState("");
    const [muted, setMuted] = useState(true);
    const [checkTimer, setCheckTimer] = useState<NodeJS.Timeout | null>(null);
    useEffect(()=>{
        if (!cameraId) return;
        const ws = new WebSocket(`${location.origin.replace("http", "ws")}/api/v1/user/ws`);
        ws.onopen = () => {
            ws.send(JSON.stringify({type: "query", id: cameraId, query: "status"}));

            setCheckTimer(setInterval(()=>{
                if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({type: "query", id: cameraId, query: "status"}));
            },30000))
        }
        ws.onmessage = (message) => {
            let data;
            try {
                data = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }
            if (data.type === "streaming") {
                setStreaming(data.streaming ?? false);
            } else if (data.type === "getInfo") {
                setUrl(`${location.protocol.replace("http","ws")}//${location.hostname}:8000/remote-live/${data.ssid.replace(/ /g, "_")}.flv`)
            } else if (data.type === "status") {
                if (data.connected) {
                    if (url == "") ws.send(JSON.stringify({type: "query", id: cameraId, query: "getInfo"}));
                    ws.send(JSON.stringify({type: "query", id: cameraId, query: "streaming"}));
                }
            }
        }

        window.onclick = () => {
            if (!foreverMute) setMuted(false);
        }

        return () => {
            if (ws.readyState === ws.OPEN) ws.close();
            if (checkTimer) clearInterval(checkTimer);
        }
    },[cameraId])







 
 
    return <div className={`relative ${className}`} style={{width: width, height: height, ...style}}>
        {isStreaming ?
        <>
            <MpegTSVideo url={url} type="mse" className={`relative ${className}`} style={style} muted={muted} height={height} width={width}>
                <div className={`w-full h-full bg-black z-20 absolute flex justify-center items-center text-sm ${className}`} style={style}>
                    <p className="text-white">Loading...</p>
                </div>
            </MpegTSVideo>
            <p className="w-full text-center mt-2 text-neutral-500" hidden={!muted || foreverMute}>Click anywhere on the page to unmute</p>
        </>
        : <div className={`w-full h-full bg-black z-20 absolute flex justify-center items-center text-sm ${className}`} style={style}>
            <p className="text-white">Camera stream not available.</p>
        </div>
        }
    </div>
}