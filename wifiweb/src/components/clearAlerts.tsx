"use client"

import { useEffect } from "react";

export default function ClearAlerts() {

    useEffect(() => {
        const event = new CustomEvent("header-alert-message", {
            detail: {
                type: "hide",
                force: true
            }
        });

        window.dispatchEvent(event);

    },[])


    return <></>
}