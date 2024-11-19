"use client";

import { Button } from "@nextui-org/react";

export default function ClaimExternalControl({camId}:{camId: string}) {

    return (
        <Button size="md" variant="flat" color="primary" onClick={()=>{
            const ws = new WebSocket(`/api/v1/user/ws`);
            ws.onopen = async () => {
                ws.send(JSON.stringify({type: "claimControl", id: camId, external: true}));
            }
            ws.onmessage = () => {
                ws.close()
            }
        }}>Claim External Control</Button>
    );
}
