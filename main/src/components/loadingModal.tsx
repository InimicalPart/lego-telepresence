"use client";

import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Spacer, Textarea} from "@nextui-org/react";
import { useEffect, useState } from "react";
import LoadingSpinner from "./loadingSpinner";
import prettyMs from "pretty-ms";
let startTime = new Date().getTime();

export default function LoadingModal({
    open, title, message,
    allowDetails = true,
    spinner = true
}: {
    open: boolean,
    title: string,
    message?: string,
    allowDetails?: boolean,
    spinner?: boolean
}) {
  const {isOpen, onOpen, onClose, onOpenChange} = useDisclosure();
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [previousMessage, setPreviousMessage] = useState<string>("");
  const [messageLog, setMessageLog] = useState<string[]>([]);


useEffect(()=>{
    if (previousMessage == "") {
            startTime = new Date().getTime();
    }
    if (message && message !== previousMessage) {
            setMessageLog((prevMessageLog) => [...prevMessageLog, `[${prettyMs(Date.now() - startTime)}] ` + message]);
            setPreviousMessage(message);
    }

    if (open) {
        if (!isOpen) {
            onOpen();
        }
    } else {
        onClose();
    }
}, [open, title, message, isOpen, onClose, onOpen, previousMessage]);


  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} isKeyboardDismissDisabled={true} hideCloseButton={true}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center">{title}</ModalHeader>
                <ModalBody className="flex items-center justify-center">
                    <LoadingSpinner size="lg" hidden={!spinner}/>
                </ModalBody>
                <ModalFooter className="text-center justify-center flex flex-col">
                    <p>{message}</p>
                    {allowDetails && 
                        <>
                            <Spacer x={2}/>
                            <Button size="md" variant="light" color="primary" onClick={()=>setShowDetails(!showDetails)}>{showDetails ? "Hide Details" : "Show Details"}</Button>
                            {showDetails && 
                                <>
                                    <Textarea value={messageLog.join("\n")} disabled readOnly variant="bordered" className="!text-neutral-600" minRows={10}></Textarea>
                                </>
                            }
                        </>
                    }
                </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}