import GetStatusValues from "@/components/buttons/getStatusValues";
import RestartStream from "@/components/buttons/restartStream";
import CarPrepare from "@/components/carPrepare";
import { Car, Volume } from "@/components/icons";
import LoadingModal from "@/components/loadingModal";
import Player from "@/components/player";
import { LTPGlobal } from "@/interfaces/global"
import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Link, Spacer, Tooltip } from "@nextui-org/react";
import { redirect } from "next/navigation";

import "@/styles/live-dot.css"
import ClaimExternalControl from "@/components/buttons/claimControl";
import PlayerView from "@/components/playerView";
import InstructionsContent from "@/components/instructionsContent";
import MovementControls from "@/components/buttons/movement";
import KeyboardControlToggle from "@/components/buttons/keyboardControl";
import FreeControlToggle from "@/components/buttons/freeControl";
import AlertNearby from "@/components/buttons/alertNearby";


declare const global: LTPGlobal;

export default async function ControlPage({ params }:any) {
    const { UUID } = await params
    const conn = global.connections.find(conn => conn.id === UUID)
    const cam = global.connections.find(carConn => carConn.type === "cam" && carConn.cam?.serialNumber === conn?.car?.cameraSerial)
    
    if (!conn || conn.type !== "car") return redirect("/")


    return <>
        <CarPrepare carID={UUID} camID={cam?.id ?? null}/>
        <div className="max-h-fit max-w-full mt-5 flex flex-col justify-center items-center self-start">
            <Card className="max-w-fit p-5 ">
                <CardHeader className="!p-0 flex flex-row gap-2 items-center justify-center">
                    <Car size={24} />
                    <h1 className="font-bold text-xl">{conn?.car?.name} - {conn?.car?.MACAddress}</h1>
                </CardHeader>
                <CardBody className="!p-0 flex flex-col gap-2 items-center justify-center">
                    <h1 className="font-bold text-md">You are controlling</h1>
                    <Spacer y={1}/>
                    <Button size="md" className="w-[75%]" variant="flat" color="default" as={Link} href="/">Leave</Button>
                </CardBody>
            </Card>
            <Spacer y={5}/>
            <div className="flex flex-col">

                <div className="flex flex-row gap-2 ">
                    <Card className="w-max min-w-80">
                        <CardHeader className="text-center flex justify-center items-center">
                            <h1 className="font-bold text-lg">Pending Instructions</h1>
                        </CardHeader>
                        <Divider orientation="horizontal" />
                        <CardBody className="flex flex-col gap-2 items-center">
                            <InstructionsContent />
                        </CardBody>
                    </Card>
                    <PlayerView camId={cam?.id ?? null} carId={UUID}/>
                </div>
                <div className="w-full flex flex-row gap-2 self-end mt-5">
                    {
                        //! Stream Controls !\\
                    }
                    <Card className={`w-80 px-5 max-h-fit ${!!cam ? "" : "select-none"}`}>
                        <Tooltip content={!!cam ? <></> : <p className="text-md font-semibold">No camera is attached</p>} showArrow={true}>
                            <div draggable={false} className={`w-full h-full z-20 bg-neutral-400 absolute p-0 top-0 left-0 ${!!cam ? "opacity-0 pointer-events-none" : "opacity-50 pointer-events-auto"}`} />
                        </Tooltip>
                        <CardHeader className="flex justify-center items-center text-center">
                            <h1 className="font-bold text-lg">Stream Controls</h1>
                        </CardHeader>
                        <Divider orientation="horizontal" />
                        <CardBody className="flex flex-col gap-2">
                            <RestartStream camId={cam?.id ?? ""}/>
                        </CardBody>
                    </Card>
                    {
                        //! Car Controls !\\
                    }
                    <Card className="w-[58%] px-5 max-h-fit">
                        <CardHeader className="flex justify-center items-center text-center">
                            <h1 className="font-bold text-lg">Car Controls</h1>
                        </CardHeader>
                        <Divider orientation="horizontal" />
                        <CardBody className="flex flex-col gap-2 items-end mt-5">
                            <MovementControls carId={UUID} />
                        </CardBody>
                    </Card>
                    {
                        //! Other Controls !\\
                    }
                    <Card className="w-[18%] px-5 max-h-fit">
                        <CardHeader className="flex justify-center items-center text-center">
                            <h1 className="font-bold text-lg">Other Controls</h1>
                        </CardHeader>
                        <Divider orientation="horizontal" />
                        <CardBody className="flex flex-col gap-2">
                            <KeyboardControlToggle />
                            <FreeControlToggle />
                            <AlertNearby camId={cam?.id ?? ""} />
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    </>
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}