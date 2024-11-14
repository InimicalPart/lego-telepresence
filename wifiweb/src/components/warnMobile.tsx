"use client"

import { Button } from "@nextui-org/react";
import { useState } from "react";

export function WarnMobileUnstableWebsite(){

    const [clicked, setClicked] = useState(false)

    if (clicked) {
        return null
    }


    return (
        <div className="fixed justify-center items-center top-0 left-0 z-[19999] dark:bg-black bg-white w-[100%] h-[100%] flex lg:hidden">

            <div className="text-center justify-center items-center flex flex-col px-10">
                <div className="flex flex-row gap-2">
                    <p className="dark:text-white text-black text-4xl">WiFiWeb</p>
                    <img src="/wifiweb-white.png" alt="WiFiWeb Logo" className="w-10 h-10 dark:block hidden" />
                    <img src="/wifiweb-black.png" alt="WiFiWeb Logo" className="w-10 h-10 block dark:hidden" />
                </div>
                <br />
                <h1 className="dark:text-white text-black text-lg">WiFiWeb is not supported or intended to function on small screens like yours.</h1>
                <h2 className="dark:text-white text-black text-lg">We highly recommend using a computer to access this website.</h2>
                <h2 className="dark:text-white text-black text-lg">But, if you wanna struggle and continue doing it on mobile, click the button below.</h2>
                <br />
                <Button color="danger" size={"lg"} variant="flat" onClick={() => setClicked(true)} >I understand, let me in.</Button>
            
            </div>


        </div>
    )
}