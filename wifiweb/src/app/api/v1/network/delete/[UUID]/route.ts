import { runTerminalCommand } from "@/util/cmd";
import { JWTCheck } from "@/util/credCheck";
import { getConnections, getCurrentConnection } from "@/util/networks";
import { NextApiRequest } from "next";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

declare const global: WiFiWebGlobal

export async function DELETE(req: NextRequest, {params}: {params:Promise<{UUID: string}>}) {
    const { UUID } = await params
    const res = await JWTCheck(true)
    if (res !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})

    const uuid = UUID as string
    if (!uuid || !uuid.match(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)) {
        return NextResponse.json({message: "Invalid UUID"}, {status: 400})
    }

    if (!global.connections.find((i) => i.uuid === uuid)) {
        return NextResponse.json({message: "Connection not found"}, {status: 404})
    }

    await runTerminalCommand(`nmcli connection delete ${uuid}`)

    return NextResponse.json({message: "OK"}, {status: 200})


}
