"use client";

import { useEffect, useRef, useState } from "react";
import { Battery, QuestionMark, Sleeping, X } from "./icons";
import { Tooltip } from "@nextui-org/react";
import { toast } from "sonner";

export default function BatteryFetcher({
    id,
    asIcon = false,
    size = 24,
    delay = 1000,

    toastAnnounceLowBattery = true,
    lowBatteryThreshold: LowBatteryThreshold = 10,


}: {id:string, asIcon?:boolean, size?:number, delay?:number, toastAnnounceLowBattery?:boolean, lowBatteryThreshold?:number}) {
    const [battery, setBattery] = useState(-1);
    const [sleeping, setSleeping] = useState(false);
    const [connected, setConnected] = useState(true);
    const [announcedLowBattery, setAnnouncedLowBattery] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const checkTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(()=>{
        if (!ws.current || (ws.current.readyState != ws.current.OPEN && ws.current.readyState != ws.current.CONNECTING))
            ws.current = new WebSocket(`${location.origin.replace("http", "ws")}/api/v1/user/ws`);

        ws.current.onmessage = (message) => {
            if (!ws.current) return;
            let data;
            try {
                data = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }
            if (data.type === "ready") {
                ws.current.send(JSON.stringify({type: "query", id, query: "status"}));
                
                checkTimer.current = setInterval(()=>{
                    if (ws.current) ws.current.send(JSON.stringify({type: "query", id, query: "status"}));
                },30000);
            } else if (data.type === "battery") {
                setBattery(data.level);
                if (data.level <= LowBatteryThreshold && toastAnnounceLowBattery && !announcedLowBattery) {
                    toast.error("Low Battery - " + (id.startsWith("car")?"Car":"Camera"), {duration: 60000, description: `Battery level is at ${data.level}%`})
                    setAnnouncedLowBattery(true);
                } else if (data.level > LowBatteryThreshold && announcedLowBattery) {
                    setAnnouncedLowBattery(false);
                }
            } else if (data.type === "status") {
                if (data.sleeping) {
                    setSleeping(true);
                    setBattery(-1);
                    return
                } else {
                    setSleeping(false);
                }

                if (data.connected) {
                    ws.current.send(JSON.stringify({type: "query", id, query: "battery"}));
                } else {
                    setConnected(false);
                    setBattery(-1);
                }
            
            } else if (data.error == "Connection not found") {
                setConnected(false);
                setBattery(-1);
            }
        }
        ws.current.onclose = () => {
            if (checkTimer.current) clearInterval(checkTimer.current as unknown as number);
        }

        return () => {
            if (ws.current && ws.current.readyState === ws.current.OPEN) ws.current.close();
            if (checkTimer.current) clearInterval(checkTimer.current as unknown as number);
        }
    },[id, announcedLowBattery, toastAnnounceLowBattery, LowBatteryThreshold])

    return <Tooltip delay={delay} placement="bottom" showArrow={true} content={<p className="">
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
                        connected === false ? <X size={size} color={"darkred"}/> :
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