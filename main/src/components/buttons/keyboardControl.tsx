"use client";

import { Button } from "@nextui-org/react";
import { useEffect, useState } from "react";

export default function KeyboardControlToggle() {

    const [keyboardControl, setKeyboardControl] = useState<boolean>(false);
    const [previousKeyboardControl, setPreviousKeyboardControl] = useState<boolean>(false);

    useEffect(() => {
        function onFreeControlUpdate(data: CustomEvent) {

            if (data.detail.becauseOfOther) return;

            if (!data.detail.value) {
                setKeyboardControl(previousKeyboardControl)
                window.dispatchEvent(new CustomEvent("LTP-KeyboardControlUpdate", {detail: {value: previousKeyboardControl, becauseOfOther: true}}));

            } else {
                setKeyboardControl(false);
                window.dispatchEvent(new CustomEvent("LTP-KeyboardControlUpdate", {detail: {value: false, becauseOfOther: true}}));
            }
        }

        window.addEventListener("LTP-FreeControlUpdate", onFreeControlUpdate as EventListener);

        return () => {
            window.removeEventListener("LTP-FreeControlUpdate", onFreeControlUpdate as EventListener);
        }

    }, [previousKeyboardControl]);

    return (
        <Button size="md" variant="flat" color="primary" onClick={()=>{
            setKeyboardControl(!keyboardControl);
            setPreviousKeyboardControl(!keyboardControl);
            window.dispatchEvent(new CustomEvent("LTP-KeyboardControlUpdate", {detail: {value: !keyboardControl, becauseOfOther: false}}));
        }}>
            {keyboardControl ? "Disable Keyboard Control" : "Enable Keyboard Control"}
        </Button>
    );
}
