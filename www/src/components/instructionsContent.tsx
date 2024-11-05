"use client"

import { Button, Card, CardBody } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { TrashBin } from "./icons"

export default function InstructionsContent() {

    const [instructions, setInstructions] = useState<{
        index: number,
        name: string,
    }[]>([])


    useEffect(() => {
        function onInstructionsUpdate(data: any) {
            data = data.detail
            switch (data.type) {
                case "add":
                    if (data.prioritized) {
                        setInstructions(instructions.map((instruction) => {
                            instruction.index += 1
                            return instruction
                        }))
                        data.instruction.index = 0
                        setInstructions([data.instruction, ...instructions])
                    } else {
                        data.instruction.index = instructions.length
                        console.log(data.instruction, instructions)
                        setInstructions([...instructions, data.instruction])
                    }

                    break;
                case "set":
                    setInstructions(data.instructions.map((instruction: any, index: number) => {
                        instruction.index = index
                        return instruction
                    }));
                    break;
                case "clear":
                    setInstructions([])
                    break;
                case "remove":
                    console.log(data.index, instructions.map((instruction, index) => "" + instruction.index + " " + index)) 
                    if (data.index || data.index == 0) {
                        setInstructions(instructions.filter((instruction, index) => index !== data.index).map((instruction, index) => {
                            instruction.index = index
                            return instruction
                        }))
                    }
                    break;
                default:
                    console.error("Invalid instruction update type")
                    break;                
            }
        }

        window.addEventListener("LTP-InstructionsUpdate", onInstructionsUpdate)

        return () => {
            window.removeEventListener("LTP-InstructionsUpdate", onInstructionsUpdate)
        }

    }, [instructions])

    return (<div className="w-full no-scrollbar overflow-y-scroll max-h-[590px] rounded-lg gap-2 flex flex-col items-center">
            { !!instructions.length ? <></> : <h1 className="font-semibold text-md">No instructions</h1> }
            {
                ...instructions.map((instruction,index) => {
                    return (
                        <Card key={index} className="flex flex-col justify-center items-center bg-neutral-100 min-h-fit shadow-sm w-full">
                            <CardBody className="flex justify-between items-center flex-row">
                                <div>
                                    <h1 className="font-bold text-lg">{instruction.name}</h1>
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