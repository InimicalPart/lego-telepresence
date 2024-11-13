import { JWTCheck } from "@/lib/credCheck";
import { changeUserPassword, getUserPassHash, getUsers, JWTFromCreds, verifyPassword } from "@/lib/credentialManager";
import { Privileges } from "@/lib/privileges";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

declare const global: WiFiWebGlobal

export async function PATCH(req: NextRequest) {
    const res = await JWTCheck(true)
    if (res.success !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})

    const form = await req.formData()

    const currentPass = form.get("current-password")?.toString()
    const actualPass = await getUserPassHash(res.username as string)

    if (!currentPass || !actualPass) {
        return NextResponse.json({message: "Invalid password", error: "NO_MATCH"}, {status: 400})
    }

    if (!await verifyPassword(currentPass, actualPass)) {
        return NextResponse.json({message: "Invalid password", error: "NO_MATCH"}, {status: 400})
    }

    const newPass = form.get("new-password")?.toString()

    if (!newPass) {
        return NextResponse.json({message: "Invalid password", error: "NO_MATCH"}, {status: 400})
    }

    return await changeUserPassword(res.username as string, newPass).catch(async (e) => {
        return NextResponse.json({message: "Internal server error", error: e}, {status: 500})
    }).then(async () => {
        (await cookies()).set("auth", await JWTFromCreds({username: res.username as string, password: newPass, hostname: global.hostname}))
        return NextResponse.json({message: "OK"}, {status: 200})
    })
}