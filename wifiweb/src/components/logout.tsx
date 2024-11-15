"use client"

import { useEffect } from "react"

export default function LogOut({action}:{action:any}) {
    useEffect(() => {
        (document.getElementById("logOutForm") as any)?.form?.requestSubmit()
    },[])
    return (<>
        <form id="logOutForm" action={action}>

        </form>
    
    </>)

}