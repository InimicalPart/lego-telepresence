import { createWiFiCommandGenerator, runTerminalCommand } from "@/lib/cmd";
import { getConnections, getCurrentConnection } from "@/lib/networks";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {


    const form = await req.formData()

    // TODO: add validation

    const staticOptionsExist = !!form.get('set-static')

    const cmd = await createWiFiCommandGenerator({
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
        interface: form.get('interface') as string ?? null
    })

    await runTerminalCommand(cmd)

    await getConnections()
    await getCurrentConnection()
    return NextResponse.json({message: "OK"}, {status: 200})
}