"use client"

import { useEffect } from "react"

interface LogOutProps {
    action: () => Promise<void>;
}

export default function LogOut({ action }: LogOutProps) {
    useEffect(() => {
        (document.getElementById("logOutForm") as HTMLFormElement)?.form?.requestSubmit()
    },[])
    return (<>
        <form id="logOutForm" action={action}>

        </form>
    
    </>)

}