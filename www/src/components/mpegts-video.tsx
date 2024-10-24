"use client";

import { useEffect, useState } from "react";
import Mpegts from "mpegts.js";

export default function MpegTSVideo({
    url,
    type,
    children,
    style,
    className
}: {
    url: string,
    type: string,
    children?: any,
    style?: any,
    className?: string
}) {

    const [ready, setReady] = useState(false)

    useEffect(() => {
        let mpegtsPlayer: any = null;
        if (Mpegts.getFeatureList().mseLivePlayback) {
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
            mpegtsPlayer.load()
            mpegtsPlayer.play()


            mpegtsPlayer.on("loading-complete", () => {
                setReady(true)
            })
            
        }
    

        return () => {
            if (mpegtsPlayer!=null)
                mpegtsPlayer.destroy()
        }
    }, [])

    return (
        <>
            <video id="videoElement" autoPlay style={style} className={className}></video>
            {!ready && children}
        </>
    )

}