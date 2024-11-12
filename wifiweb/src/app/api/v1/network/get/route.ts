import { JWTCheck } from "@/lib/credCheck";
import { getConnections, getCurrentConnection } from "@/lib/networks";
import { NextApiRequest } from "next";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

declare const global: WiFiWebGlobal

export async function GET(req: NextRequest) {
    const res = await JWTCheck(true)
    if (res !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})

    await getConnections()
    await getCurrentConnection()

    return NextResponse.json({
        connections: global.connections,
    }, {status:200})



}
