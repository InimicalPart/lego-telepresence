import GetStatusValues from "@/components/buttons/getStatusValues";
import RestartStream from "@/components/buttons/restartStream";
import CarPrepare from "@/components/carPrepare";
import { Car } from "@/components/icons";
import LoadingModal from "@/components/loadingModal";
import Player from "@/components/player";
import { LTPGlobal } from "@/interfaces/global"
import { Button, Card, CardBody, CardHeader, Divider, Link, Spacer } from "@nextui-org/react";
import { redirect } from "next/navigation";


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
                <div className="flex flex-row gap-2 items-center justify-center">
                    <Car size={24} />
                    <h1 className="font-bold text-xl">{conn?.car?.name} - {conn?.car?.MACAddress}</h1>
                </div>
                <div className="flex flex-col gap-2 items-center justify-center">
                    <h1 className="font-bold text-md">You are controlling</h1>
                    <Spacer y={1}/>
                    <Button size="md" className="w-[75%]" variant="flat" color="default" as={Link} href="/">Leave</Button>
                </div>
            </Card>
            <Spacer y={5}/>
            <Player cameraId={cam?.id ?? null} width="1024px" height="576px" className={"rounded-xl"} />
            <div className="w-[1024px] flex flex-row justify-end mt-5">
                <Card className="w-fit px-5">
                    <CardHeader className="flex justify-center items-center text-center">
                        <h1 className="font-bold text-lg">Stream Controls</h1>
                    </CardHeader>
                    <Divider orientation="horizontal" />
                    <CardBody className="flex flex-col gap-2">
                        <RestartStream camId={cam?.id ?? ""}/>
                        <GetStatusValues camId={cam?.id ?? ""}/>
                    </CardBody>
                </Card>

            </div>
        </div>
        </>
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}