"use client"

import { Card, CardHeader, CardBody } from "@nextui-org/react"
import prettyMilliseconds from "pretty-ms"
import { useEffect, useState } from "react"


export default function SystemInformation({system}:{system: {startedAt: Date, hostname: string}}) {

    const [uptime, setUptime] = useState("Loading...")

    useEffect(() => {

        const uptimeInterval = setInterval(() => {
            if (document.visibilityState === "visible")
                setUptime(prettyMilliseconds(Date.now() - system.startedAt.getTime(), {keepDecimalsOnWholeSeconds: true}))
        }, 100);


        return () => {
            clearInterval(uptimeInterval)
        }
    },[system])

    return (
        <Card className="h-[10.75rem] w-[30rem] flex">
            <CardHeader className="flex flex-row justify-between items-center font-bold gap-2">
                <p className="!justify-self-center ml-2">System Information</p>
            </CardHeader>
                <CardBody className="flex gap-2 ml-2">
                
                <div className="flex flex-col">
                    <b>Hostname</b>
                    <p className="text-sm">{system.hostname}</p>
                </div>
                <div className="flex flex-col">
                    <b>Uptime</b>
                    <p className="text-sm" id="sys-uptime">{uptime}</p>
                </div>
                </CardBody>
        </Card>
    )
}