"use client";

import { Button, Divider, Input, Kbd, Slider } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { Joystick, JoystickShape } from 'react-joystick-component';
import { PauseIcon, PlayIcon } from "../icons";

export default function MovementControls({carId}:{carId: string}) {

    const [keyboardControl, setKeyboardControl] = useState<boolean>(false);
    const [freeControl, setFreeControl] = useState<boolean>(false);
    const [sliderValue, setSliderValue] = useState<number>(0);
    const [instructionsPaused, setInstructionsPaused] = useState<boolean>(false);
    const [sliderValue2, setSliderValue2] = useState<number>(0);
    const [wsReady, setWsReady] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    const [duration, setDuration] = useState<number>(1000);
    const [speed, setSpeed] = useState<number>(100);

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

            if (data.key === "ArrowUp") {
                data.preventDefault();
                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Forwards", type: "move", direction: "forward", data: { x:0, y:1, duration, speed }}}}))
            } else if (data.key === "ArrowDown") {
                data.preventDefault();
                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Backwards", type: "move", direction: "backward", data: { x:0, y:-1, duration, speed }}}}))
            } else if (data.key === "ArrowLeft") {
                data.preventDefault();
                if (data.ctrlKey) {
                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Back Left", type: "move", direction: "left", data: { x:-1, y:-1, duration, speed }}}}))
                } else {
                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Left", type: "move", direction: "left", data: { x:-1, y:1, duration, speed }}}}))
                }
            } else if (data.key === "ArrowRight") {
                data.preventDefault();
                if (data.ctrlKey) {
                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Back Right", type: "move", direction: "right", data: { x:1, y:-1, duration, speed }}}}))
                } else {
                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Right", type: "move", direction: "right", data: { x:1, y:1, duration, speed }}}}))
                }
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
        <div className="flex flex-col gap-1 w-full">
            <div className="px-12 flex flex-row justify-center">
                <Button className="px-40" onClick={()=>{
                    const currentlyPaused = instructionsPaused;
                    setInstructionsPaused(!instructionsPaused)

                    if (currentlyPaused) {
                        window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "resume"}}))
                    } else {
                        window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "pause"}}))
                    }

                }} variant="shadow" color={instructionsPaused ? "success" : "danger"} startContent={instructionsPaused ? <PlayIcon size={16} color="currentColor"/> : <PauseIcon size={16} color="currentColor"/>}>{instructionsPaused ? "Resume" : "Pause"} Instructions</Button>
            </div>
            <Divider orientation="horizontal" className="my-2"/>
            <div className="flex flex-row justify-evenly w-full items-center">
                {/* <p className="text-center w-full font-bold">The following inputs will be added as instructions</p> */}
                <div className="flex flex-col gap-2">
                    {/* input for duration */}

                    <Input variant="faded" type="number" label="Duration (seconds)" min={1} defaultValue={(duration/1000)+""} endContent={"second"+((duration/1000) !== 1 ? "s" : "")} onChange={(v: any)=>setDuration(parseFloat(v.target.value) * 1000)}/>
                    {/* input for speed */}
                    <Input variant="faded" type="number" label="Speed" min={0} max={100} defaultValue={speed+""} endContent={"%"} onChange={(v: any)=>setSpeed(parseInt(v.target.value))}/>
                </div>
                <div className="flex flex-wrap max-w-min gap-2 border-3 p-5 rounded-xl border-neutral-700">
                    <div className="flex flex-row gap-2">
                        <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Left", type: "move", direction: "left", data: { x:-1, y:1, duration, speed }}}}))
                        }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["left"]} /> : "LEFT"}</Button>
                        <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                            window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Forwards", type: "move", direction: "forward", data: { x:0, y:1, duration, speed }}}}))
                        }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["up"]} /> : "UP"}</Button>
                        <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Right", type: "move", direction: "right", data: { x:1, y:1, duration, speed }}}}))
                        }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["right"]} /> : "RIGHT"}</Button>                    
                    </div>
                    <div className="flex flex-row gap-2">
                    <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                            window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Back Left", type: "move", direction: "left", data: { x:-1, y:-1, duration, speed }}}}))
                    }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["ctrl","left"]} /> : "B-LEFT"}</Button>
                    <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                            window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Backwards", type: "move", direction: "backward", data: { x:0, y:-1, duration, speed }}}}))
                    }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["down"]} /> : "DOWN"}</Button>
                    <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                            window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Back Right", type: "move", direction: "right", data: { x:1, y:-1, duration, speed }}}}))
                    }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["ctrl","right"]} /> : "B-RIGHT"}</Button>

                    </div>
                </div>
            </div>
        </div>
    );
}
