"use client";

import { useEffect } from "react";


export default function Home() {

    useEffect(() => {
        const Mpegts = require("mpegts.js")
        let mpegtsPlayer: any = null;
        if (Mpegts.getFeatureList().mseLivePlayback) {
            mpegtsPlayer = Mpegts.createPlayer({
                type: "mse",
                isLive: true,
                url: "ws://localhost:8000/live/obs.flv",
                hasAudio: true,
                hasVideo: true
            }, {
                liveBufferLatencyChasing: true
            })
            mpegtsPlayer.attachMediaElement(document.getElementById("videoElement") as HTMLVideoElement)
            mpegtsPlayer.load()
            mpegtsPlayer.play()

            setInterval(()=>{
                if (mpegtsPlayer == null) return
                console.log(mpegtsPlayer.currentTime, mpegtsPlayer.duration)
            },500)

            
        }
    

        return () => {
            if (mpegtsPlayer!=null)
                mpegtsPlayer.destroy()
        }
    }, [])

    return (
        <>
            <video id="videoElement" autoPlay style={{width: "800px"}} 
            ></video>
        </>
    )
}