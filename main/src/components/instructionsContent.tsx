"use client"

import { Card, CardBody } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { TrashBin } from "./icons"

export default function InstructionsContent() {

    const [instructions, setInstructions] = useState<{
        index: number,
        name: string,
    }[]>([])


    useEffect(() => {
        function onInstructionsUpdate(data: CustomEvent) {
            switch (data.type) {
                case "add":
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
                    setInstructions(data.detail.instructions.map((instruction: {index:number, name:string}, index: number) => {
                        instruction.index = index
                        return instruction
                    }));
                    break;
                case "clear":
                    setInstructions([])
                    break;
                case "remove":
                    console.log(data.detail.index, instructions.map((instruction, index) => "" + instruction.index + " " + index)) 
                    if (data.detail.index || data.detail.index == 0) {
                        setInstructions(instructions.filter((instruction, index) => index !== data.detail.index).map((instruction, index) => {
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

        window.addEventListener("LTP-InstructionsUpdate", onInstructionsUpdate as EventListener)

        return () => {
            window.removeEventListener("LTP-InstructionsUpdate", onInstructionsUpdate as EventListener)
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