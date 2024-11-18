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

import LogInForm from "@/components/logInForm";
import { runTerminalCommand } from "@/lib/cmd";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { cookies } from "next/headers";
import { JWTFromCreds, verifyCreds, verifyJWT } from "@/lib/credentialManager";
import { redirect } from "next/navigation";


import { z } from 'zod'
import ClearAlerts from "@/components/clearAlerts";
import LogOut from "@/components/logout";
 
const schema = z.object({
    username: z.string({
        invalid_type_error: 'Invalid username',
    }),
    password: z.string({
        invalid_type_error: 'Invalid password',
    })
})



export default async function LoginPage({
    searchParams
}:{
    searchParams: Promise<Record<string, string>> | undefined
}) {
    const logOut = (await searchParams)?.logout === "true"

    async function logOutAction(){
        "use server"
        if (logOut) {
            (await cookies()).delete("auth");
            return redirect("/login")
        }
    }

    const authCookie = (await cookies())?.get("auth");
    const hostname = await runTerminalCommand("hostname");



    if (authCookie && !logOut) {
        const verifyResult = await verifyJWT(authCookie.value, hostname);

        const isValid = verifyResult !== false;
        
        if (isValid) {
            return redirect("/")
        }
    }

    async function logIn(_: {message: string}, form: FormData) {
        "use server"

        const validatedFields = schema.safeParse({
            username: form.get('username'),
            password: form.get('password')
          })


        if (!validatedFields.success) {
            return {
                message: "Invalid data provided"
            }
        }

        if (await verifyCreds({
            username: form.get("username") as string,
            password: form.get("password") as string
        })) {
            const jwt = await JWTFromCreds({
                username: form.get("username") as string,
                password: form.get("password") as string,
                hostname: hostname
            });

            (await cookies()).set("auth", jwt);
        } else {
            return {
                message: "Invalid credentials"
            }
        }

        return {
            message: "There was an error logging in"
        }
    }


    return (
        <div className="flex w-[100dvw] h-[100dvh] justify-center items-center">
            <ClearAlerts />
            {logOut ? <LogOut action={logOutAction}/> : null}
            <Card >
                <CardHeader className="flex justify-center items-center">
                    <p>Log In to <b>{hostname}</b></p>
                </CardHeader>
                <CardBody>
                    <LogInForm onLogIn={logIn} />
                </CardBody>
            </Card>

        </div>
  );
}