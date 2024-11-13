import { JWTCheck } from "@/lib/credCheck";
import { getUsers } from "@/lib/credentialManager";
import UserPrivileges, { Privileges } from "@/lib/privileges";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const res = await JWTCheck(true, Privileges.MANAGE_USERS)
    if (res.success !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})

    return NextResponse.json(getUsers((user)=>{
        const {password, ...rest} = user;
        return {manageable: 
            (!new UserPrivileges(user.privileges).has(Privileges.ROOT) &&
            new UserPrivileges(res.privileges as number).has(Privileges.MANAGE_USERS)) ||
            new UserPrivileges(res.privileges as number).has(Privileges.ROOT)
        , ...rest};
    }), {status: 200});
}