"use client";

import { Card, CardBody, CardFooter, Button, Link } from "@nextui-org/react";
import { Camera, Car, EyeIcon, Volume } from "./icons";
import Player from "./player";
import { useState } from "react";
import BatteryFetcher from "./batteryFetcher";

export default function PlayerView({camId, carId, viewer = false}:{camId: string | null, carId: string | null, viewer:boolean}) {

    const [muted, setMuted] = useState(true);
    const [viewers, setViewers] = useState(0);
    
    return(
        <>
            <Card className="!p-0">
                <CardBody className="h-auto">
                    <Player cameraId={camId} width="1024px" height="576px" className={"rounded-xl"} muteNotice={false} muted={muted} viewer={viewer} setViewers={setViewers}/>
                </CardBody>
                <CardFooter className="flex justify-between">
                    <Button as={Link} variant="light" className="!w-min !min-w-min" onClick={()=>setMuted(!muted)}>
                        {muted ?
                            <Volume.MUTE size={24}/> :
                            <Volume.HIGH size={24}/>
                        }
                    </Button>
                        <div className="flex flex-row gap-1">
                            <EyeIcon size={24}/>
                            {viewers}
                        </div>
                    <div className="flex flex-row gap-5 mr-4">
                        <div className="flex flex-col">        
                            <Camera size={24}/>                
                            <BatteryFetcher delay={500} id={camId??""} asIcon toastAnnounceLowBattery lowBatteryThreshold={20}/> 
                        </div>
                        <div className="flex flex-col">                        
                            <Car size={24}/>                
                            <BatteryFetcher delay={500} id={carId??""} asIcon toastAnnounceLowBattery lowBatteryThreshold={20}/>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </>
    )
}