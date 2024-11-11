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
import { createWiFiCommandGenerator, runTerminalCommand } from "@/util/cmd";
import { JWTCheck } from "@/util/credCheck";

declare const global: WiFiWebGlobal


import { z } from 'zod'
import { getConnections, getCurrentConnection } from "../../util/networks";
 
const schema = z.object({
    ssid: z.string({
            invalid_type_error: 'Invalid SSID',
            required_error: 'SSID is required'
        })
        .min(1, { message: 'SSID is required' })
        .max(32, { message: 'SSID must be at most 32 characters long' }),
    password: z.string({
            invalid_type_error: 'Invalid password',
            required_error: 'Password is required'
        })
        .min(8, { message: 'Password must be at least 8 characters long' })
        .max(63, { message: 'Password must be at most 63 characters long' }),
    authtype: z.string({
        invalid_type_error: 'Invalid authentication type',
        required_error: 'Authentication type is required'
    })
})

export default async function Home() {

    //! Check if the user is logged in, if not, redirect to login page
    const res = await JWTCheck();
    if (res !== true) return res;

    async function create(_:any, form:FormData){
        "use server"



    }
    async function del(_:any, form:FormData){
        "use server"
        const uuid = form.get('uuid')?.toString()
        if (!uuid || !uuid.match(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)) {
            return {message: "Invalid UUID"}
        }

        await runTerminalCommand(`nmcli connection delete ${uuid}`)
        await getConnections()
        await getCurrentConnection()
        return {}
    }
    async function edit(_:any, form:FormData){
        "use server"
        console.log(form)
    }

    await getCurrentConnection()


    return (
            <DashboardElements events={{onCreate: create, onEdit: edit, onDelete: del}}  connections={global.connections} currentConnection={global.currentConnection} hostname={global.hostname}/>
    );
}