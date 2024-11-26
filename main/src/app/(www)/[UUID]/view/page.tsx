import CarPrepare from "@/components/carPrepareView";
import { Car } from "@/components/icons";
import { LTPGlobal } from "@/interfaces/global";
import { Button, Card, CardBody, CardHeader, Link, Spacer } from "@nextui-org/react";
import { redirect } from "next/navigation";

import "@/styles/live-dot.css";
import PlayerView from "@/components/playerView";
import { JWTCheck } from "@/utils/auth/credCheck";


declare const global: LTPGlobal;

export default async function ControlPage({ params }: {params:Promise<{UUID:string}>}) {
    //! Check if the user is logged in, if not, redirect to login page
    const res = await JWTCheck();
    if (res.success !== true) return res;

    const { UUID } = await params
    const conn = global.connections.find(conn => conn.id === UUID)
    const cam = global.connections.find(carConn => carConn.type === "cam" && carConn.cam?.serialNumber === conn?.car?.cameraSerial)
    
    if (!conn || conn.type !== "car") return redirect("/")
    if (conn.car?.coolingDown) return redirect("/")


    return <>
        <CarPrepare carID={UUID} camID={cam?.id ?? null}/>
        <div className="max-h-fit max-w-full mt-5 flex flex-col justify-center items-center self-start">
            <Card className="max-w-fit p-5 ">
                <CardHeader className="!p-0 flex flex-row gap-2 items-center justify-center">
                    <Car size={24} />
                    <h1 className="font-bold text-xl">{conn?.car?.name} - {conn?.car?.MACAddress}</h1>
                </CardHeader>
                <CardBody className="!p-0 flex flex-col gap-2 items-center justify-center">
                    <h1 className="font-bold text-md">You are viewing</h1>
                    <Spacer y={1}/>
                    <Button size="md" className="w-[75%]" variant="flat" color="default" as={Link} href="/">Leave</Button>
                </CardBody>
            </Card>
            <Spacer y={5}/>
            <div className="flex flex-col">

                <div className="flex flex-row gap-2 ">

                    <PlayerView camId={cam?.id ?? null} carId={UUID}/>
                </div>
               
            </div>
        </div>
    </>
}