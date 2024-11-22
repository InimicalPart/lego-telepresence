"use client";

import { Button } from "@nextui-org/react";

export default function GetStatusValues({camId}:{camId: string}) {
    return (
        <Button size="md" variant="flat" color="danger" onClick={()=>{
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
                    return ws.send(JSON.stringify({type: "query", id: camId, query: "getStatusValues"}));
                }

                ws.close();
            }
        }}>Get Values</Button>
    );
}