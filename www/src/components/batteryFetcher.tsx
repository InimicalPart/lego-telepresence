"use client";

import { LTPGlobal } from "@/interfaces/global";
import { useEffect, useState } from "react";
import { Battery, QuestionMark } from "./icons";
import {Tooltip} from "@nextui-org/react";

declare const global: LTPGlobal

export default function BatteryFetcher({
    id,
    asIcon = false,
    size = 24
}: {id:string, asIcon?:boolean, size?:number}) {
    const [battery, setBattery] = useState(-1);
    let ws: WebSocket | null = null;
    let checkTimer: NodeJS.Timeout | null = null;

    useEffect(()=>{
        ws = new WebSocket(`${location.origin.replace("http", "ws")}/api/v1/user/ws`);
        ws.onopen = () => { 
            if (ws) {
                ws.send(JSON.stringify({type: "query", id, query: "battery"}));
                checkTimer = setInterval(()=>{
                    console.log("Checking battery")
                    if (ws) ws.send(JSON.stringify({type: "query", id, query: "battery"}));
                },30000)
            
            } 
        }
        ws.onmessage = (message) => {
            let data;
            try {
                data = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }
            if (data.type === "battery") {
                setBattery(data.level);
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
    },[])

    return <>
        <Tooltip showArrow={true} hidden={false} content={
            <p>{battery !== -1 ? battery + "%" : "???"}</p>
        } style={{
            zIndex:40,
            pointerEvents: "all"
        }}>
        {
        asIcon ? (
                
                    battery === -1 ? <QuestionMark size={size}/> :
                    battery > 75 ? <Battery.FULL size={size}/> :
                    battery > 50 ? <Battery.THREE_QUARTERS size={size}/> :
                    battery > 25 ? <Battery.HALF size={size}/> :
                    battery > 10 ? <Battery.QUARTER size={size}/> :
                    <Battery.EMPTY size={size}/>
                
            ) : 
            battery 
        }
            </Tooltip>
    </>
}