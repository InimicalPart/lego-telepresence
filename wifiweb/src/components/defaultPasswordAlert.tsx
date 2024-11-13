"use client"

import { AlertPresets } from "@/lib/alertPresets";
import { useEffect } from "react"


export default function DefaultPasswordAlert({isDefault}: Readonly<{isDefault: boolean}>) {

    useEffect(()=>{
        if (isDefault) {
            const event = new CustomEvent("header-alert-message", {
                detail: {
                    type: "alert",
                    ...AlertPresets.DEFAULT_PASS,
                    force: true
                }
            });
            window.dispatchEvent(event);
        }
    },[isDefault])
    return <></>
}