"use client";

import { Button } from "@nextui-org/react";

export default function GetStatusValues({camId}:{camId: string}) {
    return (
        <Button size="md" variant="flat" color="danger" onClick={()=>{
            const ws = new WebSocket(`/api/v1/user/ws`);
            ws.onopen = async () => {
                ws.send(JSON.stringify({type: "query", id: camId, query: "getStatusValues"}));
            }
            ws.onmessage = () => {
                ws.close();
            }
        }}>Get Values</Button>
    );
}