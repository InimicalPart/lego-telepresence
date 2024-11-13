import { JWTCheck } from "@/lib/credCheck";
import { changeUserPassword, generatePassword, getUserByUUID, getUserPassHash, getUsers, JWTFromCreds, verifyPassword } from "@/lib/credentialManager";
import UserPrivileges, { Privileges } from "@/lib/privileges";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

declare const global: WiFiWebGlobal

export async function PATCH(req: NextRequest, {params}: {params:Promise<{UUID: string}>}) {
    const { UUID } = await params
    const res = await JWTCheck(true, Privileges.MANAGE_USERS)
    if (res.success !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})

    const uuid = UUID as string
    if (!uuid || !uuid.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
        return NextResponse.json({message: "Invalid UUID"}, {status: 400})
    }


    const user = await getUserByUUID(uuid)

    if (!user) {
        return NextResponse.json({message: "User not found"}, {status: 404})
    }

    if (
        !((
            !new UserPrivileges(user.privileges).has(Privileges.ROOT) &&
            new UserPrivileges(res.privileges as number).has(Privileges.MANAGE_USERS)
        ) || new UserPrivileges(res.privileges as number).has(Privileges.ROOT))) {
        return NextResponse.json({message: "You do not have permission to change this user's password"}, {status: 403})
    }

    const randomPass = await generatePassword(16)
    return await changeUserPassword(user.username, randomPass).catch(async (e) => {
        return NextResponse.json({message: "Internal server error", error: e}, {status: 500})
    }).then(async () => {
        return NextResponse.json({message: "OK", newPass: randomPass}, {status: 200})
    })
}