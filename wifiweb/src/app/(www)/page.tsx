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
import DefaultPasswordAlert from "@/components/defaultPasswordAlert";
import { Link } from "@nextui-org/react";
import Image from "next/image";

export default async function Home() {

    //! Check if the user is logged in, if not, redirect to login page
    const res = await JWTCheck();
    if (res.success !== true) return res;

    const user = await getUsernameFromJWT((await cookies())?.get("auth")?.value?.toString() as string | null, global.system.hostname)
    const privileges = getPrivileges(user as string)

    await getConnections()
    await getCurrentConnection()

    const isDefaultPass = await isDefaultPassword(await getUserPassHash(user as string) ?? "")


    return (
        <>
            <header className="flex w-full justify-center items-center text-center gap-2 mt-16 fixed select-none">
                <p className="dark:text-white text-black text-3xl">WiFiWeb</p>
                <Image src="/wifiweb-white.png" width={40} height={40} alt="WiFiWeb Logo" className="w-10 h-10 dark:block hidden" />
                <Image src="/wifiweb-black.png" width={40} height={40} alt="WiFiWeb Logo" className="w-10 h-10 block dark:hidden" />
            </header>
            <DefaultPasswordAlert isDefault={isDefaultPass}/> 
            <DashboardElements user={user as string} privileges={privileges?.toMask() ?? 0} connections={global.connections} interfaces={global.interfaces} system={global.system}/>
            <footer className="fixed bottom-0 mb-3 w-full flex justify-center items-center text-center select-none text-neutral-400">
                <p>
                    © 2024 - <Link href={"https://inimicalpart.com"} isExternal className="text-neutral-200">InimicalPart</Link> - All rights reserved.
                </p>
            </footer>
        </>
    );
}