/*
 * Copyright (c) 2024 Inimi | InimicalPart
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import DashboardElements from "@/components/dashboard";
import { JWTCheck } from "@/lib/credCheck";

declare const global: WiFiWebGlobal

import { getConnections, getCurrentConnection } from "../../lib/networks";
import { cookies } from "next/headers";
import { getPrivileges, getUsernameFromJWT, getUserPassHash, isDefaultPassword } from "@/lib/credentialManager";
import UserPrivileges, { Privileges } from "@/lib/privileges";
import DefaultPasswordAlert from "@/components/defaultPasswordAlert";

export default async function Home() {

    //! Check if the user is logged in, if not, redirect to login page
    const res = await JWTCheck();
    if (res.success !== true) return res;

    const user = await getUsernameFromJWT((await cookies())?.get("auth")?.value?.toString() as string | null, global.hostname)
    const privileges = getPrivileges(user as string)

    await getConnections()
    await getCurrentConnection()

    const isDefaultPass = await isDefaultPassword(await getUserPassHash(user as string) ?? "")


    return (
        <>
            <DefaultPasswordAlert isDefault={isDefaultPass}/> 
            <DashboardElements user={user as string} privileges={privileges?.toMask() ?? 0} connections={global.connections} interfaces={global.interfaces} hostname={global.hostname}/>
        </>
    );
}