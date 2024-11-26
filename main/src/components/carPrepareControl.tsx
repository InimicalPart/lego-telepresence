"use client";

import { useEffect, useRef, useState } from "react";
import LoadingModal from "./loadingModal";
import { generateNonce } from "@/utils/ws";

export default function CarPrepareControl({
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
    const ws = useRef<WebSocket | null>(null);

    useEffect(()=>{
        if (!ws.current || (ws.current.readyState != ws.current.OPEN && ws.current.readyState != ws.current.CONNECTING))
            ws.current = new WebSocket(`${location.origin.replace("http", "ws")}/api/v1/user/ws`);

        ws.current.onopen = () => {
            setMessage("Waiting for server to confirm that it is ready for conversation...")
        }
        ws.current.onmessage = async (message) => {
            if (!ws.current) return
            let data;
            try {
                data = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }


            if (data.error) {
                switch (data.error) {
                    case "Car already in control":
                        setMessage("Failed to claim control of car. Redirecting to dashboard in 5 seconds...");
                        setTitle("Failed to claim control");
                        setSpinner(false);
                        setTimeout(()=>{
                            window.location.href = "/";
                        },5000)
                        break;
                }
                return
            }

            switch (data.type) {
                case "ready":
                    setMessage("Checking if car is online...");
                    ws.current.send(JSON.stringify({type: "query", id: carID, query: "status"}));
                    break;
                case "claimed":
                    if (camID) {
                        setMessage("Checking camera connection...");
                        ws.current.send(JSON.stringify({type: "query", id: camID, query: "status"}))
                    } else {
                        setModalOpen(false)
                    }
                    break
                case "isCoolingDown":
                    if (!data.coolingDown) {
                        setMessage("Attempting to claim control of car...");
                        ws.current.send(JSON.stringify({type: "claimControl", id: carID}));
                    } else {
                        setMessage("Car is cooling down. Redirecting to dashboard in 5 seconds...");
                        setTitle("Car in cooldown");
                        setSpinner(false);
                        setTimeout(()=>{
                            window.location.href = "/";
                        },5000)
                    }
                case "status":
                    console.log(data)
                    if (data.connId == carID) {
                        if (!data.connected) {
                            if (ws.current.readyState == ws.current.OPEN) ws.current.close()
                            setMessage("Car is offline. Please check the connection and try again. Redirecting to dashboard in 5 seconds...");
                            setTitle("Car Offline");
                            setSpinner(false);
                            setTimeout(()=>{
                                window.location.href = "/";
                            },5000)
                        } else {
                            setMessage("Checking if car is cooling down...")
                            ws.current.send(JSON.stringify({type: "query", id: carID, query: "isCoolingDown"}))
                        }
                    } else if (data.connId == camID) {
                        console.log(data)
                        if (data.sleeping) {
                            // Camera is connected but sleeping
                            //! Wake camera
                            setMessage("Waking camera...");
                            await sendAndAwait(ws.current, {type: "wake", id: camID});
                            setMessage("Making camera stay online...");
                            ws.current.send(JSON.stringify({type: "keepAlive", enabled: true, id: camID}));
                        } else if (!data.connected) {
                            return;
                        }


                        setMessage("Checking if camera is streaming feed...");
                        const streamingResp = await sendAndAwait(ws.current, {type: "query", id: camID, query: "streaming"});
                        if (!streamingResp.streaming) {
                            setMessage("Making sure camera is connected to WiFi...");
                            await sendAndAwait(ws.current, {type: "connectToWiFi", id: camID});
                            setMessage("Disabling stabilization...");
                            await sendAndAwait(ws.current, {type: "stabilization", enabled: false, id: camID});
                            setMessage("Starting camera feed...");
                            await sendAndAwait(ws.current, {type: "startStream", id: camID});
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
            if (ws.current && ws.current.readyState === ws.current.OPEN) ws.current.close();
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
        const old = ws.onmessage;
        ws.onmessage = (message) => {
            let response;
            try {
                response = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }
            if (response.nonce === nonce) {
                ws.onmessage = old;
                resolve(response);
            }
        }
        ws.send(JSON.stringify({...data, nonce}));
    })
}
