"use client";

import { useEffect, useRef, useState } from "react";
import LoadingModal from "./loadingModal";

export default function CarPrepareView({
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
                    setMessage("Registering for events...");
                    ws.current.send(JSON.stringify({type: "register", events: ["camStreamRestart", "camStreamRestartComplete", "carClaimed", "carUnclaimed"]}));
                    setMessage("Checking if car is cooling down...");
                    ws.current.send(JSON.stringify({type: "query", id: carID, query: "isCoolingDown"}));
                    break;
                case "isClaimed":
                    if (data.claimed) {
                        setMessage("Checking if car is online...");
                        ws.current.send(JSON.stringify({type: "query", id: carID, query: "status"}));
                    } else {
                        setMessage("Car is not claimed. Redirecting to dashboard in 5 seconds...");
                        setTitle("Car Unclaimed");
                        setSpinner(false);
                        setTimeout(()=>{
                            window.location.href = "/";
                        },5000)
                }
                case "isCoolingDown":
                    if (!data.coolingDown) {
                        setMessage("Checking if car is claimed...");
                        ws.current.send(JSON.stringify({type: "query", id: carID, query: "isClaimed"}));
                    } else {
                        setMessage("Car is currently cooling down. Redirecting to dashboard in 5 seconds...");
                        setTitle("Car in cooldown");
                        setSpinner(false);
                        setTimeout(()=>{
                            window.location.href = "/";
                        },5000)
                    }
                case "status":
                    if (data.connected) {
                        setModalOpen(false);
                    }
                    break;
                case "camStreamRestart":
                    if (data.data.id == camID) {
                        window.dispatchEvent(new CustomEvent("LTP-PLAYER-RESTART-PENDING"));
                    }
                    break
                case "camStreamRestartComplete":
                    if (data.data.id == camID) {
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent("LTP-RESTART-STREAM"))
                        },1000);
                    }
                    break
                case "carUnclaimed":
                    setSpinner(false);
                    setMessage("Car has been unclaimed. Redirecting to dashboard in 5 seconds...");
                    setTitle("Car Unclaimed");
                    setModalOpen(true);
                    setTimeout(()=>{
                        window.location.href = "/";
                    },5000)
                    break

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

