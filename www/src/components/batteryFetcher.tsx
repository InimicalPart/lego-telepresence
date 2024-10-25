"use client";

import { LTPGlobal } from "@/interfaces/global";
import { useEffect, useState } from "react";
import { Battery, QuestionMark, Sleeping, X } from "./icons";
import {Tooltip} from "@nextui-org/react";

declare const global: LTPGlobal

export default function BatteryFetcher({
    id,
    asIcon = false,
    size = 24,
    delay = 1000
}: {id:string, asIcon?:boolean, size?:number, delay?:number}) {
    const [battery, setBattery] = useState(-1);
    const [sleeping, setSleeping] = useState(false);
    const [connected, setConnected] = useState(true);
    let ws: WebSocket | null = null;
    let checkTimer: NodeJS.Timeout | null = null;

    useEffect(()=>{
        ws = new WebSocket(`${location.origin.replace("http", "ws")}/api/v1/user/ws`);
        ws.onopen = () => { 
            if (ws) {
                
                if (ws) ws.send(JSON.stringify({type: "query", id, query: "status"}));
                
                checkTimer = setInterval(()=>{
                    console.log("Checking battery")
                    
                    if (ws) ws.send(JSON.stringify({type: "query", id, query: "status"}));
                },30000)
            
            } 
        }
        ws.onmessage = (message) => {
            if (!ws) return console.log("No ws");
            let data;
            try {
                data = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }
            console.log(data)
            if (data.type === "battery") {
                setBattery(data.level);
            } else if (data.type === "status") {
                if (data.sleeping) {
                    setSleeping(true);
                    setBattery(-1);
                    return
                }

                if (data.connected) {
                    ws.send(JSON.stringify({type: "query", id, query: "battery"}));
                } else {
                    setConnected(false);
                    setBattery(-1);
                }
            
            } else if (data.error == "Connection not found") {
                setConnected(false);
                setBattery(-1);
            }
        }
        ws.onclose = () => {
            console.log("Connection closed");
            if (checkTimer) clearInterval(checkTimer);
        }

        return () => {
            if (ws && ws.readyState === ws.OPEN) ws.close();
            if (checkTimer) clearInterval(checkTimer);
        }
    },[id])

    return <Tooltip delay={delay} placement="bottom" showArrow={true} content={<p>
        {
            sleeping ? "Sleeping" :
            connected === false ? "Disconnected" :
            battery !== -1 ? battery + "%" :
            "???"}
        </p>} classNames={{base: ["before:bg-neutral-700 dark:before:bg-black"], content: ["py-2 px-4 shadow-xl", "text-white bg-neutral-900"]}}>
        {
            asIcon ? (
                <div>
                    {
                        sleeping === true ? <Sleeping size={size}/> :
                        connected === false ? <X size={size}/> :
                        battery === -1 ? <QuestionMark size={size}/> :
                        battery > 75 ? <Battery.FULL size={size}/> :
                        battery > 50 ? <Battery.THREE_QUARTERS size={size}/> :
                        battery > 25 ? <Battery.HALF size={size}/> :
                        battery > 10 ? <Battery.QUARTER size={size}/> :
                        <Battery.EMPTY size={size}/>
                    }   
                </div>
            ) : 
            sleeping ? "Sleeping" : battery 
        }
    </Tooltip>
}