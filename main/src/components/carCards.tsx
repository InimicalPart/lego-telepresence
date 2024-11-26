"use client"

import { Card, CardHeader, Spacer, Divider, CardBody, Button, CardFooter, Tooltip } from "@nextui-org/react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import BatteryFetcher from "./batteryFetcher"
import { Car, Camera, X, Computer } from "./icons"
import Player from "./player"

export default function CarCards({cars: preSetCars, cams: preSetCams}:{cars?: any[], cams?: any[]}) {
    
    const [cars, setCars] = useState(preSetCars as any[])
    const [cams, setCams] = useState(preSetCams as any[])
    const ws = useRef<WebSocket | null>(null);
    const queue = useRef<any[]>([])
    let busy = false
    
    useEffect(()=>{
        if (!ws.current || (ws.current.readyState != ws.current.OPEN && ws.current.readyState != ws.current.CONNECTING))
            ws.current = new WebSocket(`${location.origin.replace("http", "ws")}/api/v1/user/ws`);
        ws.current.onmessage = (message) => {
            let data = null
            try {
                data = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }
            
            console.log(`[WS] Received message: ${data.type}`);
            queue.current.push(data)
        }
    
    }, [])


    setInterval(()=>{
        if (busy) return;
        const next = queue.current.shift()
        if (next) {
            busy = true;
            console.log("Processing next in queue: ", next)
            const data = next;
            switch (data.type) {
                case "ready":
                    if (ws.current) {
                        ws.current.send(JSON.stringify({type: "register", events: ["accessoryConnect", "accessoryDisconnect", "systemReceived", "carClaimed", "carUnclaimed", "accessoryCoolingDown", "accessoryCoolingDownComplete"]}));
                    }
                    break;
                case "accessoryConnect":
                    if (data.data.type == "car") {
                        setCars(cars => ([...cars, {
                            id: data.data.id,
                            type: data.data.type,
                            car: data.data.data
                        }]))
                    } else if (data.data.type == "cam") {
                        setCams(cams=>([...cams, {
                            id: data.data.id,
                            type: data.data.type,
                            cam: data.data.data
                        }]))
                    }
                    break;
                case "systemReceived":
                    if (data.data.type == "car") {
                        setCars(cars=>{
                            const carToUpdate = cars.find(car => car.id == data.data.id);
                            if (carToUpdate) carToUpdate.system = data.data.data;

                            return [...cars]
                        })
                    } else if (data.data.type == "cam") {
                        setCams(cams=>{
                            const camToUpdate = cams.find(cam => cam.id == data.data.id);
                            if (camToUpdate) camToUpdate.system = data.data.data;

                            return [...cams]
                        })
                    }
                    break;
                case "accessoryDisconnect":
                    if (data.data.type == "car") {
                        setCars(cars=>cars.filter(car => car.id != data.data.id))
                    } else if (data.data.type == "cam") {
                        setCams(cams=>cams.filter(cam => cam.id != data.data.id))
                    }
                    break;
                case "carClaimed":
                    setCars(cars=>{
                        const carToClaim = cars.find(car => car.id == data.data.id);
                        if (carToClaim) carToClaim.car.inControlBy = "someone";

                        return [...cars]
                    })
                    break;
                case "carUnclaimed":
                    setCars(cars=>{
                        const carToUnclaim = cars.find(car => car.id == data.data.id);
                        if (carToUnclaim) carToUnclaim.car.inControlBy = null;

                        return [...cars]
                    })
                    break;
                case "accessoryCoolingDown":
                    setCars(cars=>{
                        const carToCoolDown = cars.find(car => car.id == data.data.id);
                        if (carToCoolDown) carToCoolDown.car.coolingDown = true;

                        return [...cars]
                    })
                    break;
                case "accessoryCoolingDownComplete":
                    setCars(cars=>{
                        const carToCoolDownComplete = cars.find(car => car.id == data.data.id);
                        if (carToCoolDownComplete) carToCoolDownComplete.car.coolingDown = false;

                        return [...cars]
                    })
                    break;
                default:
                    console.log(`[WS] Unknown message type: ${data.type}`);
                    console.log(data);
                    break;
            }
            busy = false;
        }
    },50)
    
    return (
        <div className="flex h-full justify-center items-center self-center gap-2">
        {!cars.length && <p className="font-bold text-lg">No cars connected.</p>}
    
        {
        ...(cars.map( (car, i) => {
            const camera = cams.find(conn=>conn.cam?.serialNumber === car?.car?.cameraSerial) ?? null
            console.log(car, camera)
    
            const carHost = car?.system as {
                model: string,
                hostname: string,
                os: string
            } | null
            const camHost = camera?.system ?? car?.system as {
                model: string,
                hostname: string,
                os: string
            } | null
        
            const model = carHost?.model == camHost?.model ? carHost?.model : "Unknown - Mismatch"
            const hostname = carHost?.hostname == camHost?.hostname ? carHost?.hostname : "Unknown - Mismatch"
            const osName = carHost?.os == camHost?.os ? carHost?.os : "Unknown - Mismatch"
    
    
            return (
                <Card key={i}>
                    <CardHeader className="flex flex-row justify-center items-center">
                        <div className="online-dot"/>
                        <Spacer x={3}/>
                        <Car size={16}/>
                        <Spacer x={1.5}/>
                        <p className="font-extrabold">{car?.car?.name} - {car?.car?.MACAddress}</p>
                    </CardHeader>
                    <Divider orientation="horizontal"/>
                    <CardBody>
                        <Player cameraId={camera?.id as string} className={"rounded-xl"} muted/>
                        <Spacer y={1.5}/>
                        <Button variant="flat" color={car.car.inControlBy ? "secondary" : "primary"} as={Link} href={`/${car.id}/${car.car.inControlBy ? "view" : "control"}`} isDisabled={car.car.coolingDown} disabled={car.car.coolingDown}>
                            {car.car.coolingDown ? "Cooling down..." : car.car.inControlBy ? "View" : "Control"}
                        </Button>
                    </CardBody>
                    <Divider orientation="horizontal"/>
                    <CardFooter className="flex flex-row justify-center items-center gap-2">
    
                    <div className="flex flex-col justify-center items-center">
                                <Tooltip delay={500} size="sm" showArrow={true} content={
                                    <div className="flex flex-col justify-center items-center">
                                        <div className="flex flex-row justify-center items-center gap-2">
                                            <Camera size={16} color="white"/>
                                            <p className="font-extrabold">{camera?.cam?.ssid ?? "No camera attached."}</p>
                                        </div>
                                        <Divider orientation="horizontal" className="bg-white m-2.5" hidden={!camera}/>
                                        <div className="flex flex-col justify-center gap-1.5">
                                        {!!camera && 
                                                <>
                                                    <div className="flex flex-row gap-1.5">
                                                        <b>MAC:</b>
                                                        <p>{camera.cam?.MACAddress}</p>
                                                    </div>
                                                    <div className="flex flex-row gap-1.5">
                                                        <b>Model:</b>
                                                        <p>{camera.cam?.modelNumber}</p>
                                                    </div>
                                                    <div className="flex flex-row gap-1.5">
                                                        <b>S/N:</b>
                                                        <p>{camera.cam?.serialNumber}</p>
                                                    </div>
                                                    <div className="flex flex-row gap-1.5">
                                                        <b>Firmware:</b>
                                                        <p>{camera.cam?.firmwareVersion}</p>
                                                    </div>
                                                </>
                                            }
                                        </div>
                                    </div>
                                } classNames={{
                                        base: [
                                        "before:bg-neutral-700 dark:before:bg-black",
                                        ],
                                        content: [
                                        "py-2 px-4 shadow-xl",
                                        "text-white bg-neutral-900",
                                        ],
                                    }}
                                >
                                    <div>
                                        <Camera size={20}/>
                                    </div>
                                </Tooltip>
                                
                                {!!camera ?
                                    <BatteryFetcher delay={500} id={camera?.id ?? ""} asIcon/> :
                                    <X size={24} color={"darkred"}/>
                                }
                            </div>
                            <Divider orientation="vertical"/>
                            <div className="flex flex-col justify-center items-center">
                                <Tooltip delay={500} size="sm" showArrow={true} content={
                                    <div className="flex flex-col justify-center items-center">
                                        <div className="flex flex-row justify-center items-center gap-2">
                                            <Car size={16} color="white"/>
                                            <p className="font-extrabold">{car?.car?.name ?? "No car attached."}</p>
                                        </div>
                                        <Divider orientation="horizontal" className="bg-white m-2.5" hidden={!car}/>
                                        <div className="flex flex-col justify-center gap-1.5">
                                        {!!camera && 
                                                <>
                                                    <div className="flex flex-row gap-1.5">
                                                        <b>MAC:</b>
                                                        <p>{car?.car?.MACAddress}</p>
                                                    </div>
                                                    <div className="flex flex-row gap-1.5">
                                                        <b>Camera S/N:</b>
                                                        <p>{car?.car?.cameraSerial ?? <i>No camera specified by car.</i>}</p>
                                                    </div>
                                                    <div className="flex flex-row gap-1.5">
                                                        <b>Firmware:</b>
                                                        <p>{car?.car?.firmwareVersion}</p>
                                                    </div>
                                                    <div className="flex flex-row gap-1.5">
                                                        <b>Hardware:</b>
                                                        <p>{car?.car?.hardwareVersion}</p>
                                                    </div>
    
    
                                                </>
                                            }
                                        </div>
                                    </div>
                                } classNames={{
                                        base: [
                                        "before:bg-neutral-700 dark:before:bg-black",
                                        ],
                                        content: [
                                        "py-2 px-4 shadow-xl",
                                        "text-white bg-neutral-900",
                                        ],
                                    }}
                                >
                                    <div>
                                        <Car size={20}/>
                                    </div>
                                </Tooltip>
                                {!!car?
                                    <BatteryFetcher delay={500} id={car?.id ?? ""} asIcon/> : 
                                    <X size={24} color={"darkred"}/>
                                }
                            </div>
                            <Divider orientation="vertical"/>
                            <div className="flex flex-col justify-center items-center">
                                <Tooltip delay={500} size="sm" showArrow={true} content={
                                    <div className="flex flex-col justify-center items-center">
                                        <div className="flex flex-row justify-center items-center gap-2">
                                            <Computer size={16} color="white"/>
                                            <p className="font-extrabold">{hostname}</p>
                                        </div>
                                        <Divider orientation="horizontal" className="bg-white m-2.5"/>
                                            <div className="flex flex-col justify-center gap-1.5">
                                                <div className="flex flex-row gap-1.5"><b>Model:</b> <p>{model}</p></div>
                                                <div className="flex flex-row gap-1.5"><b>OS Name:</b> <p>{osName}</p></div>
                                            </div>
                                    </div>
                                } classNames={{
                                        base: [
                                        "before:bg-neutral-700 dark:before:bg-black",
                                        ],
                                        content: [
                                        "py-2 px-4 shadow-xl",
                                        "text-white bg-neutral-900",
                                        ],
                                    }}>
                                        <div>
                                            <Computer size={20}/>
                                        </div>
                                </Tooltip>
                                <p className="font-extrabold">N/A</p>
                            </div>
    
                    </CardFooter>
                </Card>
            )
        
        }))
    }
    
            
            </div>
        )
}