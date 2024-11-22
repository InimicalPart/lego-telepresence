import { Camera, Car, Computer, X } from "@/components/icons"
import { LTPGlobal } from "@/interfaces/global"
import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Spacer, Tooltip } from "@nextui-org/react"


import "@/styles/online-dot.css"
import BatteryFetcher from "@/components/batteryFetcher"
import Player from "@/components/player"
import Link from "next/link"
import { JWTCheck } from "@/utils/auth/credCheck"
declare const global: LTPGlobal

export const dynamic = 'force-dynamic'

export default async function Home() {
    //! Check if the user is logged in, if not, redirect to login page
    const res = await JWTCheck();
    if (res.success !== true) return res;

    const cars = global.connections?.filter(conn=>!!conn.car) ?? []


    return (
    <div className="flex h-full justify-center items-center self-center">
    {!cars.length && <p className="font-bold text-lg">No cars connected.</p>}

    {
    ...(await Promise.all(cars.map(async (car, i) => {
        const camera = (global.connections?.filter(conn=>!!conn.cam) ?? []).find(conn=>conn.cam?.serialNumber === car?.car?.cameraSerial) ?? null

        const carHost = (!!car ? await car.connection.sendAndAwait({type: "system"}) : null) as {
            model: string,
            hostname: string,
            os: string
        } | null
        const camHost = (!!camera ? await camera.connection.sendAndAwait({type: "system"}) : carHost) as {
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
                    <Button variant="flat" color="primary" as={Link} href={"/"+car.id+"/control"}>
                        Control
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
                                <Camera size={20}/>
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
                                <Car size={20}/>
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
                                <Computer size={20}/>
                            </Tooltip>
                            <p className="font-extrabold">N/A</p>
                        </div>

                </CardFooter>
            </Card>
        )
    
    })))
}

        
        </div>
    )
}