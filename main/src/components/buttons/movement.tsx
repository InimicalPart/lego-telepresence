"use client";

import { Button, Kbd, Slider } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { Joystick, JoystickShape } from 'react-joystick-component';

export default function MovementControls({carId}:{carId: string}) {

    const [keyboardControl, setKeyboardControl] = useState<boolean>(false);
    const [freeControl, setFreeControl] = useState<boolean>(false);
    const [sliderValue, setSliderValue] = useState<number>(0);
    const [sliderValue2, setSliderValue2] = useState<number>(0);
    const [wsReady, setWsReady] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(()=>{
        if (!ws.current || (ws.current.readyState != ws.current.OPEN && ws.current.readyState != ws.current.CONNECTING))
            ws.current = new WebSocket(`${location.origin.replace("http", "ws")}/api/v1/user/ws`);



        ws.current.onmessage = (message) => {
            let data;
            try {
                data = JSON.parse(message.data);
            } catch (error) {
                console.warn(`Error parsing message: ${error}`);
                return;
            }

            switch (data.type) {
                case "ready":
                    if (ws.current) ws.current.send(JSON.stringify({type: "register", events: ["carDisconnect"]}));
                    setWsReady(true);
                    break;
                case "carDisconnect":
                    if (data.data.id === carId) {
                        window.location.href = "/";
                    }
                    break;
            }
        }

        ws.current.onclose = () => {
            setWsReady(false);
        }

        function onKeyboardControlUpdate(data: CustomEvent) {
            setKeyboardControl(data.detail.value)
        }

        function onFreeControlUpdate(data: CustomEvent) {
            setFreeControl(data.detail.value)
        }

        window.addEventListener("LTP-KeyboardControlUpdate", onKeyboardControlUpdate as EventListener)
        window.addEventListener("LTP-FreeControlUpdate", onFreeControlUpdate as EventListener)

        function onKeyInput(data: KeyboardEvent) {
            if (!keyboardControl) return;

            // TODO: Instead of ws.send, add it to the instructions list by emitting LTP-InstructionsUpdate with {"type": "add", "instruction": {type: "move", direction: "forward"}} as the detail
            if (data.key === "ArrowUp") {
                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Forwards", type: "move", direction: "forward"}}}))
            } else if (data.key === "ArrowDown") {
                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Backwards", type: "move", direction: "backward"}}}))
            } else if (data.key === "ArrowLeft") {
                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Left", type: "move", direction: "left"}}}))
            } else if (data.key === "ArrowRight") {
                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Right", type: "move", direction: "right"}}}))
            }
        }

        window.addEventListener("keydown", onKeyInput)

        return () => {
            window.removeEventListener("LTP-KeyboardControlUpdate", onKeyboardControlUpdate as EventListener)
            window.removeEventListener("LTP-FreeControlUpdate", onFreeControlUpdate as EventListener)
            window.removeEventListener("keydown", onKeyInput)
        }

    }, [keyboardControl, freeControl])

    return (
        freeControl ? <div className="p-10 flex flex-row justify-center items-center gap-52">
            <div className="flex flex-row justify-center items-center gap-5">

            <Slider isDisabled={!wsReady} value={sliderValue} size="md" className="w-80" aria-label="ok" minValue={-100} defaultValue={0} fillOffset={0} maxValue={100} step={10} onChange={((value: number) => {
                if (value === sliderValue || !ws.current) return;
                ws.current.send(JSON.stringify({type: "setWheelAngle", id: carId, angle: value}));
                setSliderValue(value);
            }) as any} onChangeEnd={()=>{
                if (!ws.current) return
                ws.current.send(JSON.stringify({type: "setWheelAngle", id: carId, angle: 0}));
                setSliderValue(0);
            }}/>

        <Slider isDisabled={!wsReady} value={sliderValue2} size="md" className="h-80" aria-label="ok" orientation="vertical" minValue={-100} defaultValue={0} fillOffset={0} maxValue={100} step={10} onChange={((value: number) => {
                if (value === sliderValue2 || !ws.current) return;
                ws.current.send(JSON.stringify({type: "setSpeed", id: carId, amount: value}));
                setSliderValue2(value);
            }) as any} onChangeEnd={()=>{
                if (!ws.current) return;
                ws.current.send(JSON.stringify({type: "setSpeed", id: carId, amount: 0}));
                setSliderValue2(0);
            }}/>
            </div>
            <Joystick disabled={!wsReady} size={100} throttle={0} baseShape={JoystickShape.Square} stickShape={JoystickShape.Square} baseColor="black" stickColor="red" move={(a)=>{
                if (ws.current)
                    ws.current.send(JSON.stringify({type:a.type, x:a.x,y:a.y, id:carId}))
            }} stop={(a)=>{
                if (ws.current)
                    ws.current.send(JSON.stringify({...a, id:carId}))
            }} />
        </div> :
        <>
            <div className="flex flex-wrap max-w-min gap-2">
                <div className="flex flex-row gap-2">
                    <Button disabled={keyboardControl} variant="shadow" className="opacity-0 pointer-events-none"></Button>
                    <Button disabled={keyboardControl} variant="shadow" onClick={()=>!keyboardControl &&
                        window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Forwards", type: "move", direction: "forward"}}}))
                    }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["up"]} /> : "UP"}</Button>
                    <Button disabled={keyboardControl} variant="shadow" className="opacity-0 pointer-events-none"></Button>
                </div>
                <div className="flex flex-row gap-2">
                <Button disabled={keyboardControl} variant="shadow" onClick={()=>!keyboardControl &&
                        window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Left", type: "move", direction: "left"}}}))
                }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["left"]} /> : "LEFT"}</Button>
                <Button disabled={keyboardControl} variant="shadow" onClick={()=>!keyboardControl &&
                        window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Backwards", type: "move", direction: "backward"}}}))
                }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["down"]} /> : "DOWN"}</Button>
                <Button disabled={keyboardControl} variant="shadow" onClick={()=>!keyboardControl &&
                        window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Right", type: "move", direction: "right"}}}))
                }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["right"]} /> : "RIGHT"}</Button>

                </div>
            </div>
        </>
    );
}
