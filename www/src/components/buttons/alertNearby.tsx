"use client";

import { Button } from "@nextui-org/react";
import { useState } from "react";

export default function AlertNearby({camId}:{camId: string}) {
    const [alerting, setAlerting ] = useState(false);

    return (
        <Button size="md" variant="flat" color="secondary" onClick={()=>{
            setAlerting(true);
            const ws = new WebSocket(`/api/v1/user/ws`);
            ws.onopen = async () => {
                ws.send(JSON.stringify({type: "alert", id: camId}));
            }
            ws.onmessage = (message) => {
                ws.close();
                setAlerting(false);
            }
        }} disabled={alerting}>{alerting ? "Alerting..." : "Alert Nearby"}</Button>
    );
}