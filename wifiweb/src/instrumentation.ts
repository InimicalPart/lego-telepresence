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


declare const global: WiFiWebGlobal



export async function register(){
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const os = await import("os")

        if (!global.system) {
            global.system = {
                startedAt: new Date(Date.now() - (os.uptime()*1000)),
                hostname: ""
            }
        }
        global.isSystemd = !!process.env.INVOCATION_ID?.trim()
        const networks = await import("./lib/networks")
        const cmd = await import("./lib/cmd")

        if (global.isSystemd) {
            // check if lshw exists
            let lshwExists = await cmd.commandExists("lshw")
            if (!lshwExists) {
                console.warn("lshw not found, will download and install it")
                await cmd.runTerminalCommand("sudo apt-get install lshw -y").catch(() => {
                    console.error("Failed to install lshw!")
                    process.exit(1)
                }).then(() => {
                    console.log("lshw installed")
                })
            }
        }

        await networks.getNetworks()
    }
}