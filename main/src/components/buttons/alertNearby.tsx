"use client";

import { Button } from "@nextui-org/react";
import { useState } from "react";

export default function AlertNearby({camId}:{camId: string}) {
    const [alerting, setAlerting ] = useState(false);

    return (
        <Button size="md" variant="flat" color="secondary" onClick={()=>{
            setAlerting(true);
            const ws = new WebSocket(`/api/v1/user/ws`);
            ws.onmessage = (m) => {
                let data;
                try {
                    data = JSON.parse(m.data);
                } catch (error) {
                    console.warn(`Error parsing message: ${error}`);
                    return;
                }

                if (data && data.type === "ready") {
                    return ws.send(JSON.stringify({type: "alert", id: camId}));
                }


                ws.close();
                setAlerting(false);
            }
        }} disabled={alerting}>{alerting ? "Alerting..." : "Alert Nearby"}</Button>
    );
}