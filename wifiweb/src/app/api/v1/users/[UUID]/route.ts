import { JWTCheck } from "@/lib/credCheck"
import { changeUserPassword, deleteUserByUUID, generatePassword, getUserByUUID, getUserPassHash, getUUIDbyUser, JWTFromCreds, verifyPassword } from "@/lib/credentialManager"
import UserPrivileges, { Privileges } from "@/lib/privileges"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

declare const global: WiFiWebGlobal

export async function DELETE(_: NextRequest, {params}: {params:Promise<{UUID: string}>}) {
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

    const userUUID = await getUUIDbyUser(res.username as string)


    if (user.uuid === userUUID) {
        return NextResponse.json({message: "You cannot delete yourself"}, {status: 403})
    }

    if (
        !((
            !new UserPrivileges(user.privileges).has(Privileges.ROOT) &&
            new UserPrivileges(res.privileges as number).has(Privileges.MANAGE_USERS)
        ) || new UserPrivileges(res.privileges as number).has(Privileges.ROOT))) {
        return NextResponse.json({message: "You do not have permission to delete this user"}, {status: 403})
    }

    return await deleteUserByUUID(uuid).then(() => {
        return NextResponse.json({message: "OK"}, {status: 200})
    }).catch(async (e) => {
        return NextResponse.json({message: "Internal server error", error: e}, {status: 500})
    })
}

export async function PATCH(req: NextRequest, {params}: {params:Promise<{UUID: string}>}) {
    let { UUID } = await params
    const res = await JWTCheck(true)
    if (res.success !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})


    if (UUID == "@me") {
        UUID = await getUUIDbyUser(res.username as string) as string
    }

    //! User needs MANAGE_USERS to change other user's password, but can change their own password without it
    if ((UUID.toString()) != await getUUIDbyUser(res.username as string)) {
        if (!new UserPrivileges(res.privileges as number).has(Privileges.MANAGE_USERS)) {
            return NextResponse.json({message: "Unauthorized"}, {status: 401})
        }
    }

    const uuid = UUID as string
    if (!uuid || !uuid.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
        return NextResponse.json({message: "Invalid UUID"}, {status: 400})
    }

    if (UUID === await getUUIDbyUser(res.username as string)) {

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
            (await cookies()).set("auth", await JWTFromCreds({username: res.username as string, password: newPass, hostname: global.system.hostname}))
            return NextResponse.json({message: "OK"}, {status: 200})
        })

    } else {
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
}