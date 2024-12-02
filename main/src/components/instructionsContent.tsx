"use client"

import { Card, CardBody } from "@nextui-org/react"
import { useEffect, useRef, useState } from "react"
import { TrashBin } from "./icons"
import { generateNonce } from "@/utils/ws"

export default function InstructionsContent({
    carId
}:{carId: string}) {

    const [instructions, setInstructions] = useState<{
        index: number,
        name: string,
        type: string,
        data: any,
        processing: boolean
    }[]>([])

    const [wsReady, setWsReady] = useState(false);
    const [processMessages, setProcessMessages] = useState<boolean>(true);
    const processingIndex = useRef<number>(-1);

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
                    setWsReady(true);
                    break;
                default:
                    console.log(data)
                    break;
            }
        }

        ws.current.onclose = () => {
            setWsReady(false);
        }
    },[])


    useEffect(() => {
        let busy = false;
        const timer = setInterval(() => {
            if (!wsReady) return;
            if (!processMessages) return;
            if (busy) return;

            if (instructions.length > 0) {
                const instruction = instructions.shift();
                const id = instruction?.index as number;
                if (!instruction) return;
                busy = true;
                processingIndex.current = id;

                console.log(`[CMD] Running instruction: ${instruction.name}`);

                let message: {
                    [key: string]: any
                } = {
                    type: instruction.type != "stop" ? "instructionalMove" : "stop",
                    id: carId,
                }

                switch (instruction.type) {
                    case "move":
                        message.x = instruction.data.x;
                        message.y = instruction.data.y;
                        message.duration = instruction.data.duration;
                        message.speed = instruction.data.speed;
                        break;
                    case "stop":
                        break;
                    default:
                        console.error("Invalid instruction type")
                        return;
                }

                sendAndAwait(ws.current as WebSocket, message).then(() => {
                    console.log("[CMD] Instruction completed")
                    setInstructions(instructions => instructions
                        .filter((instruction) => instruction.index !== id)
                        .map((instruction) => {
                            instruction.index -= 1
                            return instruction
                        })
                    )
                    busy = false;
                    processingIndex.current = -1;
                })
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [wsReady, instructions, processMessages]);



    function generateID() {
        return Math.random().toString(36).substring(2, 9);
    }

    useEffect(() => {
        function onInstructionsUpdate(data: CustomEvent) {
            switch (data.detail.type) {
                case "add":
                    data.detail.instruction.processing = false;

                    if (data.detail.instruction.data.speed || data.detail.instruction.data.speed == 0) {
                        if (data.detail.instruction.data.speed < 1) data.detail.instruction.data.speed = 1;
                        if (data.detail.instruction.data.speed > 100) data.detail.instruction.data.speed = 100;
                    }

                    if (data.detail.instruction.data.duration || data.detail.instruction.data.duration == 0) {
                        if (data.detail.instruction.data.duration < 1) data.detail.instruction.data.duration = 1000;
                        if (data.detail.instruction.data.duration > 300000) data.detail.instruction.data.duration = 300000;
                    }

                    if (data.detail.prioritized) {
                        setInstructions(instructions.map((instruction) => {
                            instruction.index += 1
                            return instruction
                        }))
                        data.detail.instruction.index = 0
                        setInstructions([data.detail.instruction, ...instructions])
                    } else {
                        data.detail.instruction.index = instructions.length
                        console.log(data.detail.instruction, instructions)
                        setInstructions([...instructions, data.detail.instruction])
                    }



                    break;
                case "set":
                    setInstructions(data.detail.instructions.map((instruction: {index:number, name:string, data:any}, index: number) => {


                        if (instruction.data.speed || instruction.data.speed == 0) {
                            if (instruction.data.speed < 1) instruction.data.speed = 1;
                            if (instruction.data.speed > 100) instruction.data.speed = 100;
                        }
    
                        if (instruction.data.duration || instruction.data.duration == 0) {
                            if (instruction.data.duration < 1) instruction.data.duration = 1000;
                            if (instruction.data.duration > 300000) instruction.data.duration = 300000;
                        }

                        
                        instruction.index = index
                        return instruction
                    }));
                    break;
                case "clear":
                    setInstructions([])
                    break;
                case "remove":
                    if (data.detail.index || data.detail.index == 0) {
                        setInstructions(instructions.filter((_, index) => index !== data.detail.index).map((instruction, index) => {
                            instruction.index = index
                            return instruction
                        }))
                    }
                    break;
                case "pause": 
                    setProcessMessages(false);
                    break;
                case "resume":
                    setProcessMessages(true);
                    break;
                default:
                    console.error("Invalid instruction update type")
                    break;                
            }
        }

        window.addEventListener("LTP-InstructionsUpdate", onInstructionsUpdate as EventListener)

        return () => {
            window.removeEventListener("LTP-InstructionsUpdate", onInstructionsUpdate as EventListener)
        }

    }, [instructions])


    function sendAndAwait(ws: WebSocket, data: {[key:string]:string|number|boolean|null}): Promise<{[key:string]:string|number|boolean|null}> {
        return new Promise((resolve) => {
            const nonce = generateNonce();
            const old = ws.onmessage;
            ws.onmessage = (message) => {
                let response;
                try {
                    response = JSON.parse(message.data);
                } catch (error) {
                    console.warn(`Error parsing message: ${error}`);
                    return;
                }
                if (response.nonce === nonce) {
                    ws.onmessage = old;
                    resolve(response);
                }
            }
            ws.send(JSON.stringify({...data, nonce}));
        })
    }

    return (<div className="w-full no-scrollbar overflow-y-scroll max-h-[590px] rounded-lg gap-2 flex flex-col items-center">
            { !!instructions.length ? <></> : <h1 className="font-semibold text-md">No instructions</h1> }
            {
                ...instructions.map((instruction,index) => {
                    return (
                        <Card key={index} className={`flex flex-col justify-center items-center bg-neutral-100 min-h-fit shadow-sm w-full ${instruction.index == 0 && processMessages ? "fadeInAndOut" : ""}`}>
                            <CardBody className="flex justify-between items-center flex-row">
                                <div>
                                    <h1 className="font-bold text-lg">{instruction.name}</h1>
                                    <p className="text-sm text-neutral-500">Duration: {instruction.data.duration/1000}s | Speed: {instruction.data.speed}%</p>
                                </div>
                                <button className="outline-none" onClick={() => {
                                    window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {
                                        detail: {
                                            type: "remove",
                                            index: instruction.index
                                        }
                                    }))
                                }}>
                                    <TrashBin size={24}/>
                                </button>
                            </CardBody>
                        </Card>
                    )
                })
            }
        </div>)
}