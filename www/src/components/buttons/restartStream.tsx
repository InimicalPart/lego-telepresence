"use client";

import { Button } from "@nextui-org/react";
import { useState } from "react";

export default function RestartStream({camId}:{camId: string}) {
    const [restarting, setRestarting] = useState(false);

    return (
        <Button size="md" variant={restarting ? "faded" : "flat"} color="danger" disabled={restarting || !camId} onClick={()=>{
            setRestarting(true);
            window.dispatchEvent(new CustomEvent("LTP-PLAYER-RESTART-PENDING"));
            const ws = new WebSocket(`/api/v1/user/ws`);
            ws.onopen = async () => {
                ws.send(JSON.stringify({type: "restartStream", id: camId}));
            }

            ws.onmessage = async (message) => {
                setRestarting(false);
                ws.close()
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("LTP-RESTART-STREAM"))
                },1000);
            }

        }}>{ restarting ? "Restarting..." : "Restart Stream"}</Button>
    );
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}