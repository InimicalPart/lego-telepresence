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
import { verifyJWT } from "@/utils/auth/credentialManager";
import { redirect } from "next/navigation";

export async function JWTCheck(noRedirect: boolean = false, cookieString?: string) {
    let authCookie;

    if (cookieString) {
        const cookiesArray = cookieString.split("; ");
        const authCookieString = cookiesArray.find(cookie => cookie.startsWith("auth-ltp="));
        if (authCookieString) {
            const authCookieValue = authCookieString.split("=")[1];
            authCookie = { value: authCookieValue };
        }
    } else {
        authCookie = (await cookies())?.get("auth-ltp");
    }

    if (authCookie) {
        const verifyResult = await verifyJWT(authCookie.value, "ltp-web");

        const isValid = verifyResult !== false;

        if (!isValid) {
            return noRedirect ? {success: false} : redirect("/login")
        }


        return {
            success: true,
            username: verifyResult.username,
        }

    } else {
        return noRedirect ? {success: false} : redirect("/login")
    }
}