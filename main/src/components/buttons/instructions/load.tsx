


"use client";

import { UploadIcon } from "@/components/icons";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { useState } from "react";

export default function LoadButton() {

    const [loading, setLoading] = useState(false);
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [isValid, setIsValid] = useState<boolean|null>(null);
    const [instructions, setInstructions] = useState<any[]|null>(null);

    function loadFromFile() {
        setLoading(true);
        onOpen()
    }

    async function onFileChange(e: any) {
        const file = (e.target as HTMLInputElement).files?.[0]
        console.log(file)
        if (!file) {
            setIsValid(null);
            setInstructions(null);
            return;
        }

        if (file.type !== "application/json") {
            setIsValid(false);
            setInstructions(null);
            return;
        }


        const text = await file?.text()

        try {
            const instructions = JSON.parse(text);
            if (!Array.isArray(instructions)) {
                setIsValid(false);
                setInstructions(null);
                return;
            }

            setIsValid(true);
            setInstructions(instructions);
        } catch {
            setIsValid(false);
            setInstructions(null);
            return;
        }



        


    }

    return (
        <>
            <Button color="danger" variant="solid" className="w-full" startContent={<UploadIcon size={16} />} onClick={loadFromFile} isDisabled={loading} disabled={loading}>
                {loading ? "Loading..." : "Load from file"}
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={()=>{
                setLoading(false);
            }}>
                <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Load Instructions</ModalHeader>
                        <ModalBody>
                            <Input onChange={onFileChange} type="file" label="Instructions File" isRequired multiple={false} typeof="json" />
                            <p className={`text-center w-full font-bold ${isValid ? "text-green-500" : "text-red-500"}`} hidden={isValid == null}>
                                {
                                    isValid ? `Valid instructions file (${instructions?.length} instruction${ instructions?.length !==1 ? "s" : ""})` : "Invalid instructions file"
                                }
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={()=>{
                                console.log(instructions)
                                window.dispatchEvent(new CustomEvent("LTP-InstructionsUpdate", {
                                    detail: {
                                        type: "set",
                                        instructions
                                    }
                                }))
                                onClose();
                                setInstructions(null);
                                setIsValid(null);
                            }}>
                                Load
                            </Button>
                        </ModalFooter>
                    </>
                )}
                </ModalContent>
            </Modal>
        </>
    )
}