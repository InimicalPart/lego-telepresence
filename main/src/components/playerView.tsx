"use client";

import { Card, CardBody, CardFooter, Button, Link } from "@nextui-org/react";
import { Camera, Car, Volume } from "./icons";
import Player from "./player";
import { useState } from "react";
import BatteryFetcher from "./batteryFetcher";

export default function PlayerView({camId, carId}:{camId: string | null, carId: string | null}) {

    const [muted, setMuted] = useState(true);
    
    return(
        <>
            <Card className="!p-0">
                <CardBody className="h-auto">
                    <Player cameraId={camId} width="1024px" height="576px" className={"rounded-xl"} muteNotice={false} muted={muted}/>
                </CardBody>
                <CardFooter className="flex justify-between">
                    <Button as={Link} variant="light" className="!w-min !min-w-min" onClick={()=>setMuted(!muted)}>
                        {muted ?
                            <Volume.MUTE size={24}/> :
                            <Volume.HIGH size={24}/>
                        }
                    </Button>
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