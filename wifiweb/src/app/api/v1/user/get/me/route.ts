import { JWTCheck } from "@/lib/credCheck";
import { getUsers } from "@/lib/credentialManager";
import { Privileges } from "@/lib/privileges";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const res = await JWTCheck(true, Privileges.MANAGE_USERS)
    if (res.success !== true) return NextResponse.json({message: "Unauthorized"}, {status: 401})
    const { success, ...rest } = res;
    return NextResponse.json(rest, {status: 200});
}