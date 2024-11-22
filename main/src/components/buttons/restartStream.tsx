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
            ws.onmessage = async (m) => {
                let data;
                try {
                    data = JSON.parse(m.data);
                } catch (error) {
                    console.warn(`Error parsing message: ${error}`);
                    return;
                }

                if (data && data.type === "ready") {
                    return ws.send(JSON.stringify({type: "restartStream", id: camId}));
                }

                setRestarting(false);
                ws.close()
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("LTP-RESTART-STREAM"))
                },1000);
            }

        }}>{ restarting ? "Restarting..." : "Restart Stream"}</Button>
    );
}