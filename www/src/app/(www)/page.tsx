"use client";

import Mpegts from "mpegts.js";
import { useEffect } from "react";


export default function Home() {

    useEffect(() => {
        let a = null;
        if (Mpegts.getFeatureList().mseLivePlayback) {
            a = Mpegts.createPlayer({
                type: "flv",
                isLive: true,
                url: "http://localhost:8000/live/obs.flv",
                hasAudio: true,
                hasVideo: true,
            })
            a.attachMediaElement(document.getElementById("videoElement") as HTMLVideoElement)
            a.load()
            a.play()
        }
    

        return () => {
            if (a!=null)
                a.destroy()
        }
    }, [])

    return (
        <>
            <video id="videoElement" autoPlay style={{width: "800px"}} 
            ></video>
        </>
    )
}