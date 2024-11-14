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

import { cookies } from "next/headers";
import { getPrivileges, verifyJWT } from "../lib/credentialManager";
import { redirect } from "next/navigation";

declare const global: WiFiWebGlobal

export async function JWTCheck(noRedirect: boolean = false, requiredPrivileges: number = 0) {
    const authCookie = (await cookies())?.get("auth");

    if (authCookie) {
        const verifyResult = await verifyJWT(authCookie.value, global.system.hostname as any);

        const isValid = verifyResult !== false;

        if (!isValid) {
            return noRedirect ? {success: false} : redirect("/login")
        }

        if (requiredPrivileges) {
            const privs = getPrivileges(verifyResult.username)
            if (!privs || !privs.has(requiredPrivileges)) {
                return noRedirect ? {success: false} : redirect("/")
            }
        }


        return {
            success: true,
            username: verifyResult.username,
            privileges: getPrivileges(verifyResult.username)?.toMask() ?? null
        }

    } else {
        return noRedirect ? {success: false} : redirect("/login")
    }
}