"use client";

import { Button, Checkbox, Divider, Input, Kbd, Slider } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { Joystick, JoystickShape } from 'react-joystick-component';
import { PauseIcon, PlayIcon } from "../icons";

export default function MovementControls({carId}:{carId: string}) {

    const [keyboardControl, setKeyboardControl] = useState<boolean>(false);
    const [freeControl, setFreeControl] = useState<boolean>(false);
    const [freeWheelAngle, setFreeWheelAngle] = useState<number>(0);
    const [instructionsPaused, setInstructionsPaused] = useState<boolean>(false);
    const [freePower, setFreePower] = useState<number>(0);
    const [wsReady, setWsReady] = useState(false);
    const ws = useRef<WebSocket | null>(null);


    const [power, setPower] = useState<number>(0);
    const [wheelAngle, setWheelAngle] = useState<number>(0);


    const [duration, setDuration] = useState<number>(1000);
    const [speed, setSpeed] = useState<number>(100);
    const [untilOverwritten, setUntilOverwritten] = useState<boolean>(false);
    const [overridePrevious, setOverridePrevious] = useState<boolean>(true);

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
                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Forwards", type: "move", data: { x: (overridePrevious ? 0 : null), y: 1, speed, duration: untilOverwritten ? 0 : duration }}}}))
            } else if (data.key === "ArrowDown") {
                data.preventDefault();
                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Backwards", type: "move", data: { x: (overridePrevious ? 0 : null), y:-1, speed, duration: untilOverwritten ? 0 : duration }}}}))
            } else if (data.key === "ArrowLeft") {
                data.preventDefault();
                if (data.ctrlKey) {
                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Back Left", type: "move", data: { x: -1, y:-1, speed, duration: untilOverwritten ? 0 : duration }}}}))
                } else if (data.shiftKey) {
                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Turn Left", type: "move", data: { x: -1, y: (overridePrevious ? 0 : null), speed, duration: untilOverwritten ? 0 : duration }}}}))
                } else {
                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Forward Left", type: "move", data: { x: -1, y:1, speed, duration: untilOverwritten ? 0 : duration }}}}))

                }
            } else if (data.key === "ArrowRight") {
                data.preventDefault();
                if (data.ctrlKey) {
                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Back Right", type: "move", data: { x: 1, y:-1, speed, duration: untilOverwritten ? 0 : duration }}}}))
                } else if (data.shiftKey) {
                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Turn Right", type: "move", data: { x: 1, y: (overridePrevious ? 0 : null), speed, duration: untilOverwritten ? 0 : duration }}}}))
                } else {
                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Forward Right", type: "move", data: { x: 1, y:1, speed, duration: untilOverwritten ? 0 : duration }}}}))
                }
            } else if (data.key == "End") {
                data.preventDefault();
                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Stop", type: "stop"}}}))
            }
        }

        window.addEventListener("keydown", onKeyInput)

        return () => {
            window.removeEventListener("LTP-KeyboardControlUpdate", onKeyboardControlUpdate as EventListener)
            window.removeEventListener("LTP-FreeControlUpdate", onFreeControlUpdate as EventListener)
            window.removeEventListener("keydown", onKeyInput)
        }

    }, [keyboardControl, freeControl, carId, duration, speed, untilOverwritten, overridePrevious])

    return (
        freeControl ? <div className="w-full flex flex-row justify-center gap-16 items-center p-5">
            <div className="flex flex-col justify-center items-center gap-5 p-5 border-2 border-neutral-600 rounded-xl">

                <Slider label="Wheel Angle" isDisabled={!wsReady} value={freeWheelAngle} size="md" className="w-80" aria-label="ok" minValue={-100} defaultValue={0} fillOffset={0} maxValue={100} step={1} onChange={((value: number) => {
                    if (value === freeWheelAngle || !ws.current) return;
                    ws.current.send(JSON.stringify({type: "setWheelAngle", id: carId, angle: value}));
                    setFreeWheelAngle(value);
                }) as any} onDoubleClick={()=>{
                    if (!ws.current) return;
                    ws.current.send(JSON.stringify({type: "setWheelAngle", id: carId, angle: 0}));
                    setFreeWheelAngle(0)
                }}/>

                <Slider label="Power" isDisabled={!wsReady} value={freePower} size="md" className="w-80" aria-label="ok" minValue={-100} defaultValue={0} fillOffset={0} maxValue={100} step={1} onChange={((value: number) => {
                        if (value === freePower || !ws.current) return;
                        ws.current.send(JSON.stringify({type: "setSpeed", id: carId, amount: value}));
                        setFreePower(value);
                }) as any} onDoubleClick={()=>{
                    if (!ws.current) return;
                    ws.current.send(JSON.stringify({type: "setSpeed", id: carId, amount: 0}));
                    setFreePower(0)
                }}/>
            </div>
            <div className="flex flex-col gap-2 text-neutral-600 items-center justify-center select-none">
                <Divider orientation="vertical" className="h-12"/>
                <p>OR</p>
                <Divider orientation="vertical" className="h-12"/>
            </div>
            <div className="flex">

                <Joystick disabled={!wsReady} size={100} throttle={0} baseShape={JoystickShape.Square} stickShape={JoystickShape.Square} baseColor="black" stickColor="red" move={(a)=>{
                    setFreePower(0);
                    setFreeWheelAngle(0);
                    
                    if (ws.current)
                        ws.current.send(JSON.stringify({type:a.type, x:a.x,y:a.y, id:carId}))


                }} stop={(a)=>{
                    setFreePower(0);
                    setFreeWheelAngle(0);

                    if (ws.current)
                        ws.current.send(JSON.stringify({...a, id:carId}))
                }} />
            </div>
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
            <div className="flex flex-row justify-evenly w-full items-start">
                <div className="flex flex-col gap-2 p-2.5">
                    <Input isDisabled={untilOverwritten} disabled={untilOverwritten} variant="faded" type="number" label="Duration (seconds)" min={1} defaultValue={(duration/1000)+""} endContent={"second"+((duration/1000) !== 1 ? "s" : "")} onChange={(v: any)=>setDuration(parseFloat(v.target.value) * 1000)}/>
                    <Input variant="faded" type="number" label="Speed" min={0} max={100} defaultValue={speed+""} endContent={"%"} onChange={(v: any)=>setSpeed(parseInt(v.target.value))}/>
                    <Checkbox color="primary" isSelected={untilOverwritten} onChange={(v)=>setUntilOverwritten(v.target.checked)}>Forever Until Overwritten</Checkbox>
                    <Checkbox color="primary" isSelected={overridePrevious} onChange={(v)=>setOverridePrevious(v.target.checked)}>Override Previous Input</Checkbox>
                </div>
                <div className="flex flex-col gap-2 justify-center items-center">
                    <div className="flex flex-wrap max-w-min gap-2 border-3 p-5 px-12 rounded-xl border-neutral-700">
                        <div className="flex flex-row gap-2">
                            <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Forward Left", type: "move", data: { x: -1, y:1, speed, duration: untilOverwritten ? 0 : duration }}}}))
                            }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["left"]} /> : "F-LFT"}</Button>
                            <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Forwards", type: "move", data: { x: (overridePrevious ? 0 : null), y:1, speed, duration: untilOverwritten ? 0 : duration }}}}))
                            }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["up"]} /> : "FWRD"}</Button>
                            <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Forward Right", type: "move", data: { x: 1, y:1, speed, duration: untilOverwritten ? 0 : duration }}}}))
                            }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["right"]} /> : "F-RHT"}</Button>                    
                        </div>
                        <div className="flex flex-row gap-2">
                            <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Turn Left", type: "move", data: { x: -1, y: (overridePrevious ? 0 : null), speed, duration: untilOverwritten ? 0 : duration }}}}))
                            }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["shift","left"]} /> : "LEFT"}</Button>
                            <Button disabled={keyboardControl} variant="shadow" color="danger" onClick={()=>!keyboardControl &&
                                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Stop", type: "stop"}}}))
                            }>{keyboardControl ? <div className="p-1 bg-white rounded-lg text-sm">END</div> : "STOP"}</Button>
                            <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Turn Right", type: "move", data: { x: 1, y: (overridePrevious ? 0 : null), speed, duration: untilOverwritten ? 0 : duration }}}}))
                            }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["shift","right"]} /> : "RIGHT"}</Button>
                        </div>
                        <div className="flex flex-row gap-2">
                            <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Back Left", type: "move", data: { x: -1, y:-1, speed, duration: untilOverwritten ? 0 : duration }}}}))
                            }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["ctrl","left"]} /> : "B-LFT"}</Button>
                            <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Backwards", type: "move", data: { x: (overridePrevious ? 0 : null), y:-1, speed, duration: untilOverwritten ? 0 : duration }}}}))
                            }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["down"]} /> : "BWRD"}</Button>
                            <Button disabled={keyboardControl} variant="shadow" color="primary" onClick={()=>!keyboardControl &&
                                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Move Back Right", type: "move", data: { x: 1, y:-1, speed, duration: untilOverwritten ? 0 : duration }}}}))
                            }>{keyboardControl ? <Kbd className="w-8 h-8 text-lg flex items-center justify-center" keys={["ctrl","right"]} /> : "B-RHT"}</Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap max-w-min gap-5 border-3 p-5 rounded-xl border-neutral-700">
                        <div className="flex flex-col gap-2">
                            <Slider label="Power" value={power} size="md" className="w-80" aria-label="ok" minValue={-100} defaultValue={0} fillOffset={0} maxValue={100} step={1} onChange={((value: number) => {
                                setPower(value);
                            }) as any} onDoubleClick={()=>{setPower(0)}} />
                            <Slider label="Wheel Angle" value={wheelAngle} size="md" className="w-80" aria-label="ok" minValue={-100} defaultValue={0} fillOffset={0} maxValue={100} step={1} onChange={((value: number) => {
                                setWheelAngle(value);
                            }) as any} onDoubleClick={()=>{setWheelAngle(0)}}/>
                        </div>

                        <Button color="primary" className="w-full" onClick={()=>{
                            window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {detail: {type: "add", instruction: {name: "Custom Move", type: "move", data: { x: wheelAngle/100, y:power/100, speed, duration: untilOverwritten ? 0 : duration }}}}))
                        }}>
                            Add to Instructions
                        </Button>

                    </div>
                </div>
            </div>
        </div>
    );
}
