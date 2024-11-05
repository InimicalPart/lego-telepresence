"use client";

import { useEffect, useState } from "react";

// import Mpegts from "mpegts.js";

export default function MpegTSVideo({
    url,
    type,
    children,
    style,
    className,
    muted = false,
    width = 300,
    height= 168.75
}: {
    url: string,
    type: string,
    children?: any,
    style?: any,
    className?: string,
    muted?: boolean,
    width?: number | string,
    height?: number | string
}) {

    const [ready, setReady] = useState(false)
    const [reload, setReload] = useState<number>(0)

    useEffect(() => {

        if (url == "") return;

        const Mpegts = require("mpegts.js")
        //@ts-ignore
        let mpegtsPlayer: Mpegts.Player | null = null;
        if (Mpegts.getFeatureList().mseLivePlayback) {

            url = url.replace("{host}", location.host)



            mpegtsPlayer = Mpegts.createPlayer({
                type,
                isLive: true,
                url,
                hasAudio: true,
                hasVideo: true
            }, {
                liveBufferLatencyChasing: true
            })
            mpegtsPlayer.attachMediaElement(document.getElementById("videoElement") as HTMLVideoElement)


            mpegtsPlayer.on("metadata_arrived", () => {
                setReady(true)
            })

            mpegtsPlayer.on("loading_complete", () => {
                setReady(false)
            })

            mpegtsPlayer.load()
            mpegtsPlayer.play()

        }

        function onStreamRestartRequest() {
            console.log("Restarting stream")
            if (mpegtsPlayer != null) {
                mpegtsPlayer.destroy()
                mpegtsPlayer = null
            }
            setReady(false)

            setReload(reload + 1)
        }

        window.addEventListener("LTP-RESTART-STREAM", onStreamRestartRequest)

        return () => {
            if (mpegtsPlayer != null)
                mpegtsPlayer.destroy();

            window.removeEventListener("LTP-RESTART-STREAM", onStreamRestartRequest)
        }



    }, [url, reload])

    return (
        <>
            <video id="videoElement" autoPlay hidden={!ready} muted={muted} style={style} className={className} width={width} height={height}></video>
            {!ready && children}
        </>
    )

}