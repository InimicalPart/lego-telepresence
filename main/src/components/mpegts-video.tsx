"use client";

import MTS from "mpegts.js";
import React, { ReactElement, useRef } from "react";
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
    children?: ReactElement,
    style?: React.CSSProperties,
    className?: string,
    muted?: boolean,
    width?: number | string,
    height?: number | string
}) {

    const urll = useRef(url)

    const [ready, setReady] = useState(false)
    const [reload, setReload] = useState<number>(0)

    useEffect(() => {

        if (url == "") return;

        let mpegtsPlayer: MTS.Player | null = null;
        import("mpegts.js").then((Mpegts) => {
            if (Mpegts.default.getFeatureList().mseLivePlayback) {

                urll.current = urll.current.replace("{host}", location.host)



                mpegtsPlayer = Mpegts.default.createPlayer({
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
            
        })

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

    }, [url, reload, type])

    return (
        <>
            <video id="videoElement" autoPlay hidden={!ready} muted={muted} style={style} className={className} width={width} height={height}></video>
            {!ready && children}
        </>
    )

}