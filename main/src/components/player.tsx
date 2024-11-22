"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import MpegTSVideo from "./mpegts-video";

export default function Player({
    width = "300px",
    height = "168.75px",
    cameraId,
    className,
    style,
    muteNotice = false,
    muted = true
}: {
    width?: string,
    height?: string,
    cameraId: string|null,
    className?: string,
    style?: CSSProperties,
    muteNotice?: boolean,
    muted?: boolean,
}) {


    const [isStreaming, setStreaming] = useState(false)
    const [url, setUrl] = useState("");
    const [restartPending, setRestartPending] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const checkTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(()=>{
        if (!ws.current || (ws.current.readyState != ws.current.OPEN && ws.current.readyState != ws.current.CONNECTING))
            ws.current = new WebSocket(`${location.origin.replace("http", "ws")}/api/v1/user/ws`);
        if (!cameraId) return;
        ws.current.onmessage = (message) => {
            if (!ws.current) return; 
            let data;
            try {
                data = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }

            if (data.type === "ready") {
                ws.current.send(JSON.stringify({type: "query", id: cameraId, query: "status"}));

                checkTimer.current = setInterval(()=>{
                    if (ws.current && ws.current.readyState === ws.current.OPEN) ws.current.send(JSON.stringify({type: "query", id: cameraId, query: "status"}));
                },30000)
            } else if (data.type === "streaming") {
                setStreaming(data.streaming ?? false);
            } else if (data.type === "getInfo") {
                setUrl(`${location.protocol.replace("http","ws")}//${location.hostname}:8000/remotelive/${data.ssid.replace(/ /g, "_")}.flv`)
            } else if (data.type === "status") {
                if (data.connected) {
                    if (ws.current) {
                        if (url == "") ws.current.send(JSON.stringify({type: "query", id: cameraId, query: "getInfo"}));
                        ws.current.send(JSON.stringify({type: "query", id: cameraId, query: "streaming"}));
                    }
                }
            }
        }

        function onRestartPending(){
            setRestartPending(true);
        }
        function onRestart(){
            setRestartPending(false);
        }

        window.addEventListener("LTP-PLAYER-RESTART-PENDING", onRestartPending)
        window.addEventListener("LTP-RESTART-STREAM", onRestart)


        return () => {
            if (ws.current && ws.current.readyState === ws.current.OPEN) ws.current.close();
            if (checkTimer.current) clearInterval(checkTimer.current);

            window.removeEventListener("LTP-PLAYER-RESTART-PENDING", onRestartPending)
            window.removeEventListener("LTP-RESTART-STREAM", onRestart)
        }
    },[cameraId, checkTimer, ws, url])







 
 
    return <div className={`relative ${className}`} style={{width: width, height: height, ...style}}>
        {restartPending ? <>
            <div className={`w-full h-full bg-black z-20 absolute flex justify-center items-center text-sm ${className}`}>
                <p id="restarting-text" className={`fade text-white text-md font-bold`}>Restarting camera stream...</p>
            </div>
        </> : isStreaming ?
            <>
                <MpegTSVideo url={url} type="mse" className={`relative ${className}`} style={style} muted={muted} height={height} width={width}>
                    <div className={`w-full h-full bg-black z-20 absolute flex justify-center items-center text-sm ${className}`} style={style}>
                        <p className="text-white text-md font-bold">Loading...</p>
                    </div>
                </MpegTSVideo>
                <p className="w-full text-center mt-2 text-neutral-500" hidden={!muted || !muteNotice}>Click anywhere on the page to unmute</p>
            </>
            : <div className={`w-full h-full bg-black z-20 absolute flex justify-center items-center text-sm ${className}`} style={style}>
                <p className="text-white text-md font-bold">Camera stream not available.</p>
            </div>
        }
    </div>
}