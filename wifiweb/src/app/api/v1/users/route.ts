import { JWTCheck } from "@/lib/credCheck";
import { createUser, generatePassword, getUsers } from "@/lib/credentialManager";
import UserPrivileges, { PrivilegePresets, Privileges } from "@/lib/privileges";
import { NextRequest, NextResponse } from "next/server";


export async function GET() {
    const res = await JWTCheck(true, Privileges.MANAGE_USERS)
    if (res.success !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})

    return NextResponse.json(getUsers((user: { username: string; privileges: number; password?: string; uuid: string; createdAt: string; createdBy: string })=>{
        const userCopy = {...user};

        delete userCopy.password;
        return {manageable: 
            (!new UserPrivileges(user.privileges).has(Privileges.ROOT) &&
            new UserPrivileges(res.privileges as number).has(Privileges.MANAGE_USERS)) ||
            new UserPrivileges(res.privileges as number).has(Privileges.ROOT)
        , ...userCopy};
    }), {status: 200});
}

export async function POST(req: NextRequest) {
    const res = await JWTCheck(true, Privileges.MANAGE_USERS)
    if (res.success !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})

    const form = await req.formData()


    const username = (form.get("username")?.toString().toLowerCase() ?? "").trim()

    if (!username) {
        return NextResponse.json({message: "Invalid username", error: "INVALID_USER"}, {status: 400})
    }

    if (username.length < 3 || username.length > 64) {
        return NextResponse.json({message: "Invalid username", error: "INVALID_USER"}, {status: 400})
    }

    const userExists = getUsers((u)=>u.username).some((u)=>u===username) || username === "system"

    if (userExists) {
        return NextResponse.json({message: "This username is already taken", error: "ALREADY_TAKEN"}, {status: 400})
    }

    const password = form.get("password")?.toString() || await generatePassword(16)

    if (!password) {
        return NextResponse.json({message: "Invalid password", error: "INVALID_PASSWORD"}, {status: 400})
    }

    if (password.length < 5 || password.length > 64) {
        return NextResponse.json({message: "Password must be between 5 and 64 characters", error: "PASS_INVALID_LENGTH"}, {status: 400})
    }

    const privileges = parseInt(form.get("privileges")?.toString() ?? "0")

    if (isNaN(privileges)) {
        return NextResponse.json({message: "Invalid privileges", error: "INVALID_PRIVS"}, {status: 400})
    }

    if (privileges < 0 || privileges > PrivilegePresets.ALL) {
        return NextResponse.json({message: "Invalid privileges", error: "INVALID_PRIVS"}, {status: 400})
    }

   return await createUser(username, password, privileges, res.username as string).then(async () => {
        return NextResponse.json({
            message: "OK",
            user: username,
            ...(
                password !== form.get("password")?.toString() ? {password} : {}
            )
        }, {status: 200})
    }).catch(async (e) => {
        return NextResponse.json({message: "Internal server error", error: e}, {status: 500})
    })
}