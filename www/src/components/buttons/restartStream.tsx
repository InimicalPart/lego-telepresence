"use client";

import { Button } from "@nextui-org/react";
import { useState } from "react";

export default function RestartStream({camId}:{camId: string}) {
    const [restarting, setRestarting] = useState(false);

    return (
        <Button size="md" variant="flat" color="danger" disabled={restarting} onClick={()=>{
            setRestarting(true);
            console.log("Asking server to restart stream");
            const ws = new WebSocket(`/api/v1/user/ws`);
            ws.onopen = async () => {
                ws.send(JSON.stringify({type: "restartStream", id: camId}));
                await sleep(5000)
                setRestarting(false);
                ws.close()
                window.dispatchEvent(new CustomEvent("LTP-RESTART-STREAM"))
            }
        }}>Restart Stream</Button>
    );
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}