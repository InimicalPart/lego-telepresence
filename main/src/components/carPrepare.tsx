"use client";

import { useEffect, useState } from "react";
import LoadingModal from "./loadingModal";
import { generateNonce } from "@/utils/ws";

export default function CarPrepare({
    carID,
    camID
}: {
    carID: string,
    camID: string | null
}) {

    const [modalOpen, setModalOpen] = useState<boolean>(true);
    const [title, setTitle] = useState<string>("Preparing Car");
    const [message, setMessage] = useState<string>("Connecting to user interface...");
    const [spinner, setSpinner] = useState<boolean>(true);

    useEffect(()=>{
        const ws = new WebSocket(`${location.origin.replace("http", "ws")}/api/v1/user/ws`);
        ws.onopen = () => {
            setMessage("Waiting for server to confirm that it is ready for conversation...")
        }
        ws.onmessage = async (message) => {
            let data;
            try {
                data = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }


            switch (data.type) {
                case "ready":
                    setMessage("Checking if car is online...");
                    ws.send(JSON.stringify({type: "query", id: carID, query: "status"}));
                case "status":
                    if (data.connId == carID) {
                        if (!data.connected) {
                            if (ws.readyState == ws.OPEN) ws.close()
                            setMessage("Car is offline. Please check the connection and try again. Redirecting to dashboard in 5 seconds...");
                            setTitle("Car Offline");
                            setSpinner(false);
                            setTimeout(()=>{
                                window.location.href = "/";
                            },5000)
                        } else {
                            if (camID) {
                                setMessage("Checking camera connection...");
                                ws.send(JSON.stringify({type: "query", id: camID, query: "status"}));
                            } else {
                                setModalOpen(false)
                            }
                        }
                    } else if (data.connId == camID) {
                        if (data.sleeping) {
                            // Camera is connected but sleeping
                            //! Wake camera
                            setMessage("Waking camera...");
                            await sendAndAwait(ws, {type: "wake", id: camID});
                            setMessage("Making camera stay online...");
                            ws.send(JSON.stringify({type: "keepAlive", enabled: true, id: camID}));
                        } else if (!data.connected) {
                            return;
                        }


                        setMessage("Checking if camera is streaming feed...");
                        const streamingResp = await sendAndAwait(ws, {type: "query", id: camID, query: "streaming"});
                        if (!streamingResp.streaming) {
                            setMessage("Making sure camera is connected to WiFi...");
                            await sendAndAwait(ws, {type: "connectToWiFi", id: camID});
                            setMessage("Disabling stabilization...");
                            await sendAndAwait(ws, {type: "stabilization", enabled: false, id: camID});
                            setMessage("Starting camera feed...");
                            await sendAndAwait(ws, {type: "startStream", id: camID});
                            setMessage("Camera feed started, video feed should be visible shortly...");
                            setSpinner(false);
                            setTimeout(()=>{
                                setModalOpen(false);
                            }, 5000)
                        } else {
                            setModalOpen(false);
                        }


                    }
            }

        }
        return () => {
            if (ws.readyState === ws.OPEN) ws.close();
        }
    },[carID, camID])

    return (
        <>
            <LoadingModal open={modalOpen} title={title} message={message} spinner={spinner}/>
        </>
    );
}

function sendAndAwait(ws: WebSocket, data: {[key:string]:string|number|boolean|null}): Promise<{[key:string]:string|number|boolean|null}> {
    return new Promise((resolve) => {
        const nonce = generateNonce();
        ws.onmessage = (message) => {
            let response;
            try {
                response = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }
            if (response.nonce === nonce) {
                resolve(response);
            }
        }
        ws.send(JSON.stringify({...data, nonce}));
    })
}
