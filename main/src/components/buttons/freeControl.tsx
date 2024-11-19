"use client"

import { Button } from "@nextui-org/react";
import { useEffect, useState } from "react";

export default function FreeControlToggle() {

    const [freeControl, setFreeControl] = useState<boolean>(false);

    useEffect(() => {
        // KeyboardControlUpdate
        function onKeyboardControlUpdate(data: CustomEvent) {
            if (data.detail.value && freeControl && !data.detail.becauseOfOther) {
                setFreeControl(false);
                window.dispatchEvent(new CustomEvent("LTP-FreeControlUpdate", {detail: {value: false, becauseOfOther: true}}));
            }
        }

        window.addEventListener("LTP-KeyboardControlUpdate", onKeyboardControlUpdate as EventListener);

        return () => {
            window.removeEventListener("LTP-KeyboardControlUpdate", onKeyboardControlUpdate as EventListener);
        }

    },[freeControl]);

    return (
        <Button size="md" variant="flat" color="secondary" onClick={()=>{
            setFreeControl(!freeControl);
            window.dispatchEvent(new CustomEvent("LTP-FreeControlUpdate", {detail: {value: !freeControl, becauseOfOther: false}}));
        }}>
            {freeControl ? "Disable Free Control" : "Enable Free Control"}
        </Button>
    );
}