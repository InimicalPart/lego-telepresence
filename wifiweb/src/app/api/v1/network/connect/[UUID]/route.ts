import { activateConnection, modifyWiFiCommandGenerator, runTerminalCommand } from "@/lib/cmd";
import { JWTCheck } from "@/lib/credCheck";
import { getConnections, getCurrentConnection } from "@/lib/networks";
import { NextRequest, NextResponse } from "next/server";

declare const global: WiFiWebGlobal

export async function POST(req: NextRequest, {params}: {params:Promise<{UUID: string}>}) {
    const { UUID } = await params
    const res = await JWTCheck(true)
    if (res !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})

    const uuid = UUID as string
    if (!uuid || !uuid.match(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)) {
        return NextResponse.json({message: "Invalid UUID"}, {status: 400})
    }


    const connection = global.connections.find((i) => i.uuid === uuid)

    if (!connection) {
        return NextResponse.json({message: "Connection not found"}, {status: 404})
    }

    const form = await req.formData()

    // TODO: add validation

    const cmd = await modifyWiFiCommandGenerator(UUID, {
        interface: form.get('interface') as string ?? null
    })

    await runTerminalCommand(cmd)
    await sleep(1000)
    await activateConnection(UUID)

    await getConnections()
    await getCurrentConnection()
    return NextResponse.json({message: "OK"}, {status: 200})
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}