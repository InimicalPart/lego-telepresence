"use client";

import { Button } from "@nextui-org/react";
import { useState } from "react";

export default function GetStatusValues({camId}:{camId: string}) {
    return (
        <Button size="md" variant="flat" color="danger" onClick={()=>{
            console.log("Asking server to restart stream");
            const ws = new WebSocket(`/api/v1/user/ws`);
            ws.onopen = async () => {
                ws.send(JSON.stringify({type: "query", id: camId, query: "getStatusValues"}));
                await sleep(5000)
                ws.close()
            }
        }}>Get Values</Button>
    );
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}