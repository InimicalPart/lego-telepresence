/*
 * Copyright (c) 2024 Inimi | InimicalPart
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

"use client";

import { Card, CardHeader, CardBody, useDisclosure, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Input, Select, SelectItem, Spacer, Checkbox, CheckboxGroup, Tooltip, Divider } from "@nextui-org/react";
import { useActionState, useEffect, useState } from "react";
import { AddIcon, DeleteIcon, EditIcon } from "./icons";
import "@/styles/active-dot.css"
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

const initialState = {message: ''}

export default function DashboardElements({connections, currentConnection, hostname, events}:{events:{onCreate:any, onEdit:any, onDelete:any},connections:WiFiWebGlobal["connections"], currentConnection:WiFiWebGlobal["currentConnection"], hostname: string}) {

    const {isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose, onOpenChange: onEditOpenChange} = useDisclosure();
    const {isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose, onOpenChange: onAddOpenChange} = useDisclosure();

    const [createState, createWifiAction] = useActionState(events.onCreate as any, initialState) as any   
    const [editState, editWifiAction] = useActionState(events.onEdit as any, initialState) as any
    const [deleteState, deleteWifiAction] = useActionState(events.onDelete as any, initialState) as any 

    const [createPending, setCreatePending] = useState<boolean>(false);
    const [editPending, setEditPending] = useState<boolean>(false);
    const [deletePending, setDeletePending] = useState<boolean>(false);


    const [connectionss, setConnections] = useState<WiFiWebGlobal["connections"]>(connections);
    const [currentConnectionn, setCurrentConnection] = useState<WiFiWebGlobal["currentConnection"]>(currentConnection);



    const [selectedConnection, setSelectedConnection] = useState<WiFiWebGlobal["connections"][0] | null>(null);
    const [showIPConf, setShowIPConf] = useState<boolean>(false);
    const [autoconnect, setAutoconnect] = useState<boolean>(true);
    const [hoveredOverConnection, setHoveredOverConnection] = useState<WiFiWebGlobal["connections"][0] | null>(null);

    const [authType, setAuthType] = useState<"wpa-psk" | "wpa-eap" | "open">("wpa-psk");

    // useEffect(()=>{
    //     if (!createPending) {
    //         onAddClose();
    //     }

    // }, [createPending])

    useEffect(()=>{
        if (!editPending) {
            onEditClose();
        }

    }, [editPending])


    async function onCreateSubmit(e:any){
        setCreatePending(true);
        e.preventDefault();

        fetch("/api/v1/network/create", {
            method: "POST",
            body: new FormData(e.target),
        }).then((res)=>{
            new Promise<void>((resolve, reject)=>setTimeout(()=>resolve(), 1000)).then(()=>{
              fetch("/api/v1/network/get").then((res)=>res.json()).then((data)=>{
                    setConnections(data.connections);
                    setCurrentConnection(data.currentConnection);
                    onAddClose();
                    setCreatePending(false);
                })
            })
        })
    }

    async function onDeleteSubmit(e:any){
        setDeletePending(true);
        e.preventDefault();

        const uuid = e.target.uuid.value;

        fetch(`/api/v1/network/delete/${uuid}` , {
            method: "DELETE",
        }).then((res)=>{
            new Promise<void>((resolve, reject)=>setTimeout(()=>resolve(), 1000)).then(()=>{
              fetch("/api/v1/network/get").then((res)=>res.json()).then((data)=>{
                    setConnections(data.connections);
                    setCurrentConnection(data.currentConnection);
                    setDeletePending(false);
                })
            })
        })

    }


    return (<>
         <iframe name="theTank" width="0" height="0" className="hidden border-none h-0 w-0"></iframe>
        <div className="flex flex-col w-[100dvw] h-[100dvh] justify-center items-center">

            <div className="flex flex-row gap-2">
                <Card className="h-[15rem] w-[30rem] flex">
                </Card>

                <Card className="h-[80dvh] w-[30rem] flex ">
                    <CardHeader className="flex flex-row justify-center items-center font-bold gap-2 ml-5">
                        <p>Network Connections</p>
                        <Button className="!min-w-0 justify-self-end dark:text-neutral-200 text-neutral-800" onClick={()=>onAddOpen()} disabled={deletePending || createPending || editPending}>
                            <AddIcon size={16} />
                        </Button>
                    </CardHeader>
                    <CardBody className="flex gap-2">
                        {...connectionss.map((connection: any, _:any) => {
                            return (
                                <Card key={_} className="min-h-fit py-2 dark:bg-neutral-800" onMouseOver={()=>setHoveredOverConnection(connection)} onMouseOut={()=>setHoveredOverConnection(null)}>
                                    <CardHeader className="py-0 flex items-center font-bold gap-2">
                                        {connection.name == currentConnectionn?.name && 
                                            <Tooltip content={<p><b>{hostname}</b> is currently connected to this network.</p>} showArrow>
                                                <div className="active-dot"/>
                                            </Tooltip>
                                        }
                                        {connection.name}
                                    </CardHeader>
                                    <CardBody className="py-0 grid flex-row items-center">
                                        <p className="dark:text-gray-400 text-sm">Type: {connection.type}</p>
                                        <div hidden={hoveredOverConnection != connection && false} className="justify-self-end gap-2 flex">
                                            <Button className="!min-w-0 dark:text-neutral-200 text-neutral-800"><EditIcon   size={16} /></Button>
                                            <form onSubmit={onDeleteSubmit} target="theTank">
                                                <input type="hidden" hidden name="uuid" value={connection.uuid} />    
                                                <Button className="!min-w-0 dark:text-neutral-200 text-neutral-800 disabled:dark:bg-neutral-500 disabled:bg-neutral-400" disabled={deletePending || createPending || editPending} type="submit"><DeleteIcon size={16} /></Button>
                                            </form>
                                        </div>
                                    </CardBody>
                                </Card>
                            )
                        })}
                    </CardBody>
                </Card>
            </div>

        </div>
        <Modal isOpen={isAddOpen} onOpenChange={onAddOpenChange}>
            <ModalContent>
            {(onClose) => (
                <>
                    <ModalHeader className="flex flex-col gap-1">Add Network Connection</ModalHeader>
                    <ModalBody>
                        <p>Add a new network connection for <b>{hostname}</b></p>
                        <form className="flex flex-col gap-2" onSubmit={onCreateSubmit} target="theTank">
                            <Input required isRequired minLength={1} maxLength={32} name="ssid" label="SSID" variant="bordered" placeholder="MyCoolNetwork-1N1M1"></Input>
                            <Select required isRequired name="authtype" defaultSelectedKeys={["wpa-psk"]} label="Authentication Type" variant="bordered" value={authType} onChange={(e)=>{console.log(e.target.value);setAuthType(e.target.value as any)}}>
                                <SelectItem value={"open"} key="open">OPEN (none)</SelectItem>
                                <SelectItem value={"wpa-psk"} key="wpa-psk">WPA (password)</SelectItem>
                                <SelectItem value={"wpa-eap"} key="wpa-eap">WPA-EAP (username & password)</SelectItem>
                            </Select>
                            {authType === "wpa-psk" && <Input required isRequired minLength={8} maxLength={63} name="password" autoComplete="current-password" label="Password" variant="bordered" type="password" placeholder="inimiHasThePass"></Input>}
                            {authType === "wpa-eap" && <>
                                <Input required isRequired name="username" minLength={1} autoComplete="username" label="Username" variant="bordered" type="text" placeholder="inimi"></Input>
                                <Input required isRequired name="password" minLength={8} maxLength={63} autoComplete="current-password" label="Password" variant="bordered" type="password" placeholder="inimiHasThePass"></Input>
                            </>}
                            <Spacer y={2} />
                            <CheckboxGroup size="sm"  name="settings" label="Settings" defaultValue={["autoconnect"]}>
                                <Checkbox size="sm" name="set-static" value="set-static" onChange={(e)=>setShowIPConf(e.target.checked)}>Set a static IP address for this connection</Checkbox>
                                {showIPConf && <Input required isRequired minLength={7} size="sm" name="static-ip-addresses" label="Static IP Addresses (separate with commas)" variant="bordered" placeholder="192.168.1.63,10.53.223.4"></Input>}
                                {showIPConf && <Input required isRequired minLength={7} size="sm" name="static-gateway" label="Gateway Address" variant="bordered" placeholder="192.168.1.1"></Input>}
                                {showIPConf && <Input required isRequired minLength={7} size="sm" name="static-dns-servers" label="Static DNS Servers (separate with commas)" variant="bordered" placeholder="1.1.1.1,1.0.0.1"></Input>}
                                <Checkbox size="sm" name="autoconnect" value="autoconnect" onChange={(e)=>setAutoconnect(e.target.checked)}>Automatically connect to this network when in range</Checkbox>
                                {autoconnect && <Input required isRequired minLength={1} maxLength={7} size="sm" name="autoconnect-priority" label="Priority" variant="bordered" type="number" placeholder="0" defaultValue="0"></Input>}
                                {autoconnect && <Input required isRequired minLength={1} maxLength={7} size="sm" name="autoconnect-retries" label="Retries" variant="bordered" type="number" placeholder="5" defaultValue="5"></Input>}
                                <Checkbox size="sm" name="hidden" value="hidden" >This network is hidden (not broadcasting its SSID)</Checkbox>
                        
                            </CheckboxGroup>
                            <Spacer y={1.5} />
                            <Divider orientation="horizontal" />
                            <Spacer y={1.5} />
                            <p aria-live="polite" className="text-sm font-semibold text-red-500 text-center" hidden={!createState?.message}>{createState?.message}</p>
                            <div className="flex flex-row py-2 justify-end w-full">
                                <Button color="danger" variant="light" onPress={onClose} disabled={deletePending || createPending || editPending}>
                                    Cancel
                                </Button>
                                <Button color="primary" type="submit" disabled={deletePending || createPending || editPending}>
                                    {createPending ? "Adding..." : "Add"}
                                </Button>
                            </div>
                        </form>
                    </ModalBody>
                </>
            )}
            </ModalContent>
        </Modal>
        <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange}>
            <ModalContent>
            {(onClose) => (
                <>
                    <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
                    <ModalBody>
                        <p> 
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Nullam pulvinar risus non risus hendrerit venenatis.
                        Pellentesque sit amet hendrerit risus, sed porttitor quam.
                        </p>
                        <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Nullam pulvinar risus non risus hendrerit venenatis.
                        Pellentesque sit amet hendrerit risus, sed porttitor quam.
                        </p>
                        <p>
                        Magna exercitation reprehenderit magna aute tempor cupidatat consequat elit
                        dolor adipisicing. Mollit dolor eiusmod sunt ex incididunt cillum quis. 
                        Velit duis sit officia eiusmod Lorem aliqua enim laboris do dolor eiusmod. 
                        Et mollit incididunt nisi consectetur esse laborum eiusmod pariatur 
                        proident Lorem eiusmod et. Culpa deserunt nostrud ad veniam.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                            Close
                        </Button>
                        <Button color="primary" onPress={onClose}>
                            Action
                        </Button>
                    </ModalFooter>
                </>
            )}
            </ModalContent>
        </Modal>
        </>
    )
}