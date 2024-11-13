import { modifyWiFiCommandGenerator, restartConnection, runTerminalCommand } from "@/lib/cmd";
import { JWTCheck } from "@/lib/credCheck";
import { getConnections, getCurrentConnection } from "@/lib/networks";
import { NextApiRequest } from "next";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

declare const global: WiFiWebGlobal

export async function PATCH(req: NextRequest, {params}: {params:Promise<{UUID: string}>}) {
    const { UUID } = await params
    const res = await JWTCheck(true)
    if (res.success !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})

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

    const staticOptionsExist = !!form.get('set-static')

    const cmd = await modifyWiFiCommandGenerator(UUID, {
        ssid: form.get('ssid') as string,
        wifiSecurity: form.get('authtype') as "wpa-psk" | "wpa-eap" | "none",
        password: form.get('authtype') === "none" ? undefined : form.get('password') as string,
        username: form.get('authtype') === "wpa-eap" ? form.get('username') as string : undefined,

        static: staticOptionsExist ? {
            ips: form.get('static-ip-addresses')?.toString().split(",").map((ip:string)=>ip.trim()) as string[],
            gateway: form.get('static-gateway') as string,
            dns: form.get('static-dns-servers')?.toString().split(",").map((ip:string)=>ip.trim()) as string[]
        } : undefined,

        autoconnect: {
            enabled: !!form.get('autoconnect'),
            priority: form.get('autoconnect-priority') ? parseInt(form.get('autoconnect-priority') as string) : 0,
            retries: form.get('autoconnect-retries') ? parseInt(form.get('autoconnect-retries') as string) : 5
        },
        hidden: !!form.get('hidden'),
        interface: form.get('interface') == "any" ? null : form.get('interface') as string ?? null
    })

    await runTerminalCommand(cmd)

    await sleep(1000)
    await restartConnection(UUID)
    await sleep(1000)
    await getConnections()
    await getCurrentConnection()
    await sleep(1000)

    try {
        return NextResponse.json({message: "OK"}, {status: 200})
    } catch (e) {
        console.error(e)
    }


}

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}
