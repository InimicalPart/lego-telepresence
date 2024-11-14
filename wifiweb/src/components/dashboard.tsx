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

import { Card, CardHeader, CardBody, useDisclosure, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Input, Select, SelectItem, Spacer, Checkbox, CheckboxGroup, Tooltip, Divider, Popover, PopoverContent, PopoverTrigger, CardFooter } from "@nextui-org/react";
import { useActionState, useEffect, useState } from "react";
import { AddIcon, DeleteIcon, EditIcon, EyeFilledIcon, EyeSlashFilledIcon } from "./icons";
import "@/styles/active-dot.css"
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { CIDRToSubnetMask } from "@/lib/subnetmask";
import { ScrollArea } from "@/components/ui/scroll-area"
import UserPrivileges, { Privileges } from "@/lib/privileges";
import { UsersTable } from "./usersTable";
import { toast } from "sonner";
import Users from "./users";
import SystemInformation from "./sysinfo";

export default function DashboardElements({user, privileges: userPrivs, connections, interfaces, system}:{user: string, privileges: UserPrivileges["privileges"], connections:WiFiWebGlobal["connections"], interfaces:WiFiWebGlobal["interfaces"], system: WiFiWebGlobal["system"]}) {


    const {isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose, onOpenChange: onEditOpenChange} = useDisclosure();
    const {isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose, onOpenChange: onAddOpenChange} = useDisclosure();

    const [privileges, setPrivileges] = useState<UserPrivileges>(new UserPrivileges(userPrivs));

    const [createPending, setCreatePending] = useState<boolean>(false);
    const [editPending, setEditPending] = useState<boolean>(false);
    const [deletePending, setDeletePending] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

    const toggleVisibility = () => setIsVisible(!isVisible);

    const [connectionss, setConnections] = useState<WiFiWebGlobal["connections"]>(connections.toSorted((con1: any, con2: any)=>{
        if (con1.autoconnect.enabled && con2.autoconnect.enabled) {
            if (con1.autoconnect.priority === con2.autoconnect.priority) {
                return con1.name.localeCompare(con2.name);
            }
            return con2.autoconnect.priority - con1.autoconnect.priority;
        }
        return con1.autoconnect.enabled ? -1 : 1;
    }));


    const [selectedConnection, setSelectedConnection] = useState<WiFiWebGlobal["connections"][0] | null>(null);
    const [hoveredOverConnection, setHoveredOverConnection] = useState<WiFiWebGlobal["connections"][0] | null>(null);

    const [createShowIPConf, setCreateShowIPConf] = useState<boolean>(false);
    const [createAutoconnect, setCreateAutoconnect] = useState<boolean>(true);
    const [createAuthType, setCreateAuthType] = useState<"wpa-psk" | "wpa-eap" | "open">("wpa-psk");
    
    const [editShowIPConf, setEditShowIPConf] = useState<boolean>(false);
    const [editAutoconnect, setEditAutoconnect] = useState<boolean>(true);
    const [editAuthType, setEditAuthType] = useState<"wpa-psk" | "wpa-eap" | "open">("wpa-psk");

    const [connectToInterface, setConnectToInterface] = useState<string|null>(null);
    const [connectPending, setConnectPending] = useState<boolean>(false);
    const [disconnectPending, setDisconnectPending] = useState<boolean>(false);

    async function onCreateSubmit(e:any){
        setCreatePending(true);
        e.preventDefault();

        fetch("/api/v1/network/create", {
            method: "POST",
            body: new FormData(e.target),
        }).then((res)=>{
            new Promise<void>((resolve, reject)=>setTimeout(()=>resolve(), 1000)).then(()=>{
              fetch("/api/v1/network/get").then((res)=>res.json()).then((data)=>{
                    setConnections(data.connections.toSorted((con1: any, con2: any)=>{
                        if (con1.autoconnect.enabled && con2.autoconnect.enabled) {
                            if (con1.autoconnect.priority === con2.autoconnect.priority) {
                                return con1.name.localeCompare(con2.name);
                            }
                            return con2.autoconnect.priority - con1.autoconnect.priority;
                        }
                        return con1.autoconnect.enabled ? -1 : 1;                       
                    }));
                    onAddClose();
                    setCreatePending(false);
                })
            })
        })
    }

    async function onEditSubmit(e:any){
        setEditPending(true);
        e.preventDefault();
        const uuid = e.target.uuid.value;

        fetch(`/api/v1/network/modify/${uuid}`, {
            method: "PATCH",
            body: new FormData(e.target),
        }).then((res)=>{
            new Promise<void>((resolve, reject)=>setTimeout(()=>resolve(), 1000)).then(()=>{
              fetch("/api/v1/network/get").then((res)=>res.json()).then((data)=>{
                    setConnections(data.connections.toSorted((con1: any, con2: any)=>{
                        if (con1.autoconnect.enabled && con2.autoconnect.enabled) {
                            if (con1.autoconnect.priority === con2.autoconnect.priority) {
                                return con1.name.localeCompare(con2.name);
                            }
                            return con2.autoconnect.priority - con1.autoconnect.priority;
                        }
                        return con1.autoconnect.enabled ? -1 : 1;                       
                    }));
                    onEditClose();
                    setEditPending(false);
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
                    setConnections(data.connections.toSorted((con1: any, con2: any)=>{
                        if (con1.autoconnect.enabled && con2.autoconnect.enabled) {
                            if (con1.autoconnect.priority === con2.autoconnect.priority) {
                                return con1.name.localeCompare(con2.name);
                            }
                            return con2.autoconnect.priority - con1.autoconnect.priority;
                        }
                        return con1.autoconnect.enabled ? -1 : 1;                        
                    }));
                    setDeletePending(false);
                })
            })
        })

    }

    async function connectToOther(popoverControl: any, e:any){
        console.log(e);
        setConnectPending(true);
        e.preventDefault();

        const uuid = e.target.uuid.value;

        await fetch(`/api/v1/network/connect/${uuid}`, {
            method: "POST",
            body: new FormData(e.target),
        }).then((res)=>{
            new Promise<void>((resolve, reject)=>setTimeout(()=>resolve(), 1000)).then(()=>{
              fetch("/api/v1/network/get").then((res)=>res.json()).then((data)=>{
                    setConnections(data.connections.toSorted((con1: any, con2: any)=>{
                        if (con1.autoconnect.enabled && con2.autoconnect.enabled) {
                            if (con1.autoconnect.priority === con2.autoconnect.priority) {
                                return con1.name.localeCompare(con2.name);
                            }
                            return con2.autoconnect.priority - con1.autoconnect.priority;
                        }
                        return con1.autoconnect.enabled ? -1 : 1;                        
                    }));
                    popoverControl(false);
                    setConnectPending(false);
                })
            })
        })
    }

    async function disconnect(e:any){
        setDisconnectPending(true);
        e.preventDefault();

        const uuid = e.target.uuid.value;

        await fetch(`/api/v1/network/disconnect/${uuid}`, {
            method: "POST",
            body: new FormData(e.target),
        }).then((res)=>{
            new Promise<void>((resolve, reject)=>setTimeout(()=>resolve(), 1000)).then(()=>{
              fetch("/api/v1/network/get").then((res)=>res.json()).then((data)=>{
                    setConnections(data.connections.toSorted((con1: any, con2: any)=>{
                        if (con1.autoconnect.enabled && con2.autoconnect.enabled) {
                            if (con1.autoconnect.priority === con2.autoconnect.priority) {
                                return con1.name.localeCompare(con2.name);
                            }
                            return con2.autoconnect.priority - con1.autoconnect.priority;
                        }
                        return con1.autoconnect.enabled ? -1 : 1;                        
                    }));
                    setDisconnectPending(false);
                })
            })
        })
    }

    return (<>
         <iframe name="theTank" width="0" height="0" className="hidden border-none h-0 w-0"></iframe>
        <div className="flex flex-col w-[100dvw] h-[100dvh] justify-center items-center">

            <div className="flex flex-row gap-2">
                <div className="flex flex-col gap-2">

                    <SystemInformation system={system} />
                    <Users user={user} privileges={privileges} />
                </div>
                

                <Card className="h-[60rem] w-[30rem] flex">
                    <CardHeader className="flex flex-row justify-between items-center font-bold gap-2">
                        <p className="!justify-self-center ml-2">Network Connections</p>
                        <Button className="!min-w-0 !justify-self-end" color="default" onClick={()=>onAddOpen()} isDisabled={deletePending || createPending || editPending}>
                            <AddIcon size={16} />
                        </Button>
                    </CardHeader>
                    <ScrollArea>
                        <CardBody className="flex gap-2">
                            {...connectionss.map((connection: any, _:any) => {
                                let [popoverOpen, setPopoverOpen] = interfaces.length > 1 && !connection.connected ? useState<boolean>(false) : [false, ()=>{}];

                                return (
                                    <Card key={_} className="min-h-fit py-2 dark:bg-neutral-800" onMouseOver={()=>setHoveredOverConnection(connection)} onMouseOut={()=>setHoveredOverConnection(null)}>
                                        <CardHeader className="py-0 flex items-center font-bold gap-2">
                                            {connection.connected && 
                                                <Tooltip content={<p><b>{system.hostname}</b> is currently connected to this network.</p>} showArrow>
                                                    <div className="active-dot"/>
                                                </Tooltip>
                                            }
                                            <div className="flex flex-row gap-1 items-center">

                                                <Tooltip placement="right" closeDelay={100} content={
                                                    <div>
                                                        <div className="flex flex-row gap-2 items-center">
                                                            <div hidden={!connection.connected} className="active-dot"/>
                                                            <div className="flex flex-row gap-1 items-center font-semibold">
                                                                <p className="font-bold text-medium">{connection.name}</p>
                                                                <p className="text-gray-500 text-sm">(AC: {connection.autoconnect?.enabled ? `ON, priority: ${connection.autoconnect?.priority})` : "OFF"}</p>
                                                            </div>

                                                        </div>
                                                        <Spacer y={1} />
                                                        <Divider orientation="horizontal" />
                                                        <Spacer y={1} />
                                                        <div>
                                                            <p className="flex flex-wrap max-w-[400px] gap-1"><b>IPv4 Addresses:</b> {
                                                                connection.additional["ipv4.addresses"]?.split(",")?.map((ip: string)=>ip.replace(/\/.*$/,"") + "/" + CIDRToSubnetMask(parseInt(ip.match(/\/(.*)$/)?.[1] || "32")))?.join(", ") ?? 
                                                                (Object.keys(connection.additional).filter((key)=>key.match(/^IP4.ADDRESS/)).map((key)=>connection.additional[key].replace(/\/.*$/,"") + "/" + CIDRToSubnetMask(connection.additional[key].match(/\/(.*)$/)[1])).join(", ")
                                                                || "none")
                                                            }</p>
                                                            <p className="flex flex-wrap max-w-[400px] flex-row gap-x-1"><b>IPv4 Gateway:</b> {
                                                                connection.additional["ipv4.gateway"] ?? 
                                                                connection.additional["IP4.GATEWAY"] ?? "none"
                                                            }</p>
                                                            <p className="flex flex-wrap max-w-[400px] flex-row gap-x-1"><b>IPv4 DNS:</b> {
                                                                connection.additional["ipv4.dns"]?.split(",")?.join(", ") ?? 
                                                                (Object.keys(connection.additional).filter((key)=>key.match(/^IP4.DNS/)).map((key)=>connection.additional[key]).join(", ")
                                                                || "none")

                                                            }</p>
                                                            <Spacer y={2} />
                                                            <p className="flex flex-wrap max-w-[400px] flex-row gap-x-1"><b>IPv6 Addresses:</b> {
                                                                connection.additional["ipv6.addresses"]?.split(",")?.join(", ") ?? 
                                                                (Object.keys(connection.additional).filter((key)=>key.match(/^IP6.ADDRESS/)).map((key)=>connection.additional[key]).join(", ")
                                                                || "none")  
                                                            }</p>
                                                            <p className="flex flex-wrap max-w-[400px] flex-row gap-x-1"><b>IPv6 Gateway:</b> {
                                                                connection.additional["ipv6.gateway"] ?? 
                                                                connection.additional["IP6.GATEWAY"] ?? "none"
                                                            }</p>
                                                            <p className="flex flex-wrap max-w-[400px] flex-row gap-x-1"><b>IPv6 DNS:</b> {
                                                                connection.additional["ipv6.dns"]?.split(",")?.join(", ") ??
                                                                (Object.keys(connection.additional).filter((key)=>key.match(/^IP6.DNS/)).map((key)=>connection.additional[key]).join(", ")
                                                                || "none")
                                                            }</p>
                                                            <Spacer y={2} />
                                                            <p><b>{connection.connected ? "Connected via i": "I"}nterface:</b> {connection.interface == null ? "none" : interfaces.some((iface)=>iface.interface === connection.interface)?`${interfaces.find((iface)=>iface.interface === connection.interface)?.via}: ${connection.interface} (${interfaces.find((iface)=>iface.interface === connection.interface)?.serial.toUpperCase()})`:connection.interface == "N/A" ? "Any" : connection.interface}</p>
                                                        </div>
                                                    </div>
                                                } showArrow>
                                                    <p>{connection.name}</p>
                                                </Tooltip>
                                                <p className="text-gray-500 text-sm">(AC: {connection.autoconnect?.enabled ? `ON, priority: ${connection.autoconnect?.priority})` : "OFF"}</p>
                                            </div>

                                        </CardHeader>
                                        <CardBody className="py-0 grid flex-row items-center">
                                            <p className="dark:text-gray-400 text-sm">Type: {connection.wifiSecurity}</p>
                                            <div className="flex flex-row w-full justify-between mt-2">
                                                <div hidden={hoveredOverConnection != connection && false} className="flex">
                                                    <form onSubmit={disconnect} target="theTank">
                                                        <input type="hidden" hidden name="uuid" value={connection.uuid} />
                                                        <Button type="submit" color="danger" variant="flat" className={!connection.connected ? "hidden" : ""} isDisabled={disconnectPending || connectPending}>
                                                            Disconnect
                                                        </Button>
                                                    </form>
                                                    <form onSubmit={connectToOther.bind(null, ()=>{})} target="theTank">
                                                        <input type="hidden" hidden name="uuid" value={connection.uuid} />
                                                        <Button color="primary" type="submit" variant="flat" className={connection.connected || interfaces.length > 1 ? "hidden" : ""} isDisabled={connectPending}>
                                                            Connect
                                                        </Button>
                                                    </form>
                                                    <Popover placement="bottom" showArrow offset={10} isOpen={popoverOpen} onOpenChange={setPopoverOpen} isDismissable={!connectPending}>
                                                        <PopoverTrigger>
                                                            <Button color="primary" variant="flat" className={connection.connected || interfaces.length == 1 ? "hidden" : ""} isDisabled={connectPending} onClick={()=>{setConnectToInterface(null)}}>
                                                                Connect
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[400px]">
                                                            {(titleProps) => (
                                                            <div className="px-1 py-2 w-full">
                                                                <p className="text-small font-bold text-foreground" {...titleProps}>
                                                                    Choose Network Interface
                                                                </p>
                                                                <div className="mt-2 flex flex-col gap-2 w-full">
                                                                    <form onSubmit={connectToOther.bind(null, setPopoverOpen)} target="theTank">
                                                                        <input type="hidden" hidden name="uuid" value={connection.uuid} />
                                                                        <Select name="interface" label="Network Interface" variant="bordered" onChange={(e)=>setConnectToInterface(e.target.value as string)} required isRequired>
                                                                            {...interfaces.map((netInterface: any, _:any) => {
                                                                                return <SelectItem value={netInterface.interface} key={netInterface.interface} textValue={`${netInterface.via}: ${netInterface.interface} (${netInterface.serial.toUpperCase()})`}>{netInterface.via}: <b>{netInterface.interface}</b> ({netInterface.serial.toUpperCase()})</SelectItem>
                                                                            }) as any}
                                                                        </Select>
                                                                        <Spacer hidden={connectToInterface == null || !connectionss.some(a=>a.interface == connectToInterface && a.connected)} y={2} />
                                                                        <p hidden={connectToInterface == null || !connectionss.some(a=>a.interface == connectToInterface && a.connected)} className="text-center text-yellow-500">
                                                                            <b className="text-neutral-200">{connectToInterface}</b> is currently connected to <b className="text-neutral-200">{connectionss.find(a=>a.interface == connectToInterface && a.connected)?.name}</b>.<br/><br/>Doing this will disconnect the interface from that network.
                                                                        </p>
                                                                        <Spacer y={2} />
                                                                        <Button color="primary" variant="flat" className="w-full" isDisabled={!connectToInterface || connectPending} type="submit">
                                                                            Connect
                                                                        </Button>
                                                                    </form>
                                                                </div>
                                                            </div>
                                                            )}
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                                <div hidden={hoveredOverConnection != connection && false} className="gap-2 flex">
                                                    <Tooltip content={<p>Edit this network connection</p>} showArrow>
                                                        <Button onClick={()=>{
                                                            setEditAuthType(connection?.wifiSecurity?.toLowerCase() as any ?? "wpa-psk");
                                                            setEditShowIPConf((!!connection?.static?.ips || !!connection?.static?.dns || !!connection?.static?.gateway) ? true : false);
                                                            setSelectedConnection(connection);
                                                            onEditOpen();
                                                        }} color="primary" variant="flat" isDisabled={deletePending || createPending || editPending} type="submit"><EditIcon   size={16} /></Button>
                                                    </Tooltip> 
                                                    <form onSubmit={onDeleteSubmit} target="theTank">
                                                        <input type="hidden" hidden name="uuid" value={connection.uuid} />   
                                                        <Tooltip content={<p>Delete this network connection</p>} showArrow>
                                                            <Button color="danger" variant="flat" className="!min-w-0" isDisabled={deletePending || createPending || editPending} type="submit"><DeleteIcon size={16} /></Button>
                                                        </Tooltip> 
                                                    </form>
                                                </div>
                                            </div>

                                        </CardBody>
                                    </Card>
                                )
                            })}
                        </CardBody>
                    </ScrollArea>
                </Card>
            </div>

        </div>
        <Modal isOpen={isAddOpen} onOpenChange={onAddOpenChange} isDismissable={false}>
            <ModalContent>
            {(onClose) => (
                <>
                    <ModalHeader className="flex flex-col gap-1">Add Network Connection</ModalHeader>
                    <ModalBody>
                        <p>Add a new network connection for <b>{system.hostname}</b></p>
                        <form className="flex flex-col gap-2" onSubmit={onCreateSubmit} target="theTank">
                            <Input required isRequired minLength={1} maxLength={32} name="ssid" label="SSID" variant="bordered" placeholder="MyCoolNetwork-1N1M1"></Input>
                            <Select required isRequired name="authtype" defaultSelectedKeys={["wpa-psk"]} label="Authentication Type" variant="bordered" value={createAuthType} onChange={(e)=>{setCreateAuthType(e.target.value as any)}}>
                                <SelectItem value={"open"} key="open">OPEN (none)</SelectItem>
                                <SelectItem value={"wpa-psk"} key="wpa-psk">WPA (password)</SelectItem>
                                <SelectItem value={"wpa-eap"} key="wpa-eap">WPA-EAP (username & password)</SelectItem>
                            </Select>
                            {createAuthType === "wpa-psk" && <Input endContent={
                                    <button className="focus:outline-none" type="button" onClick={toggleVisibility} aria-label="toggle password visibility">
                                        {isVisible ? (
                                            <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                        ) : (
                                            <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                        )}
                                        </button>
                                    } required isRequired name="password" minLength={8} maxLength={63}  autoComplete="current-password" label="Password" variant="bordered" type={isVisible ? "text" : "password"}
                                    placeholder="inimiHasThePass"></Input>}
                            {createAuthType === "wpa-eap" && <>
                                <Input required isRequired name="username" minLength={1} autoComplete="username" label="Username" variant="bordered" type="text" placeholder="inimi"></Input>
                                <Input endContent={
                                    <button className="focus:outline-none" type="button" onClick={toggleVisibility} aria-label="toggle password visibility">
                                        {isVisible ? (
                                            <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                        ) : (
                                            <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                        )}
                                        </button>
                                    } required isRequired name="password" minLength={8} maxLength={63} autoComplete="current-password" label="Password" variant="bordered" type={isVisible ? "text" : "password"}
                                    placeholder="inimiHasThePass"></Input>
                            </>}
                            <Spacer y={2} />
                            <CheckboxGroup size="sm"  name="settings" label="Settings" defaultValue={["autoconnect"]}>
                                <Checkbox size="sm" name="set-static" value="set-static" onChange={(e)=>setCreateShowIPConf(e.target.checked)}>Set a static IP address for this connection</Checkbox>
                                {createShowIPConf && <Input required isRequired minLength={7} size="sm" name="static-ip-addresses" label="Static IP Addresses (separate with commas)" variant="bordered" placeholder="192.168.1.63,10.53.223.4"></Input>}
                                {createShowIPConf && <Input required isRequired minLength={7} size="sm" name="static-gateway" label="Gateway Address" variant="bordered" placeholder="192.168.1.1"></Input>}
                                {createShowIPConf && <Input required isRequired minLength={7} size="sm" name="static-dns-servers" label="Static DNS Servers (separate with commas)" variant="bordered" placeholder="1.1.1.1,1.0.0.1"></Input>}
                                <Checkbox size="sm" name="autoconnect" value="autoconnect" onChange={(e)=>setCreateAutoconnect(e.target.checked)}>Automatically connect to this network when in range</Checkbox>
                                {createAutoconnect && <Input required isRequired minLength={1} maxLength={7} size="sm" name="autoconnect-priority" label="Priority" variant="bordered" type="number" placeholder="0" defaultValue="0"></Input>}
                                {createAutoconnect && <Input required isRequired minLength={1} maxLength={7} size="sm" name="autoconnect-retries" label="Retries (-1 to try forever)" variant="bordered" type="number" placeholder="-1" defaultValue="-1"></Input>}
                                <Checkbox size="sm" name="hidden" value="hidden" >This network is hidden (not broadcasting its SSID)</Checkbox>
                        
                            </CheckboxGroup>
                            <Spacer y={1.5} />
                            <Divider orientation="horizontal" />
                            <Spacer y={1.5} />
                            <div className="flex flex-row py-2 justify-end w-full">
                                <Button color="danger" variant="light" onClick={onClose} isDisabled={deletePending || createPending || editPending}>
                                    Cancel
                                </Button>
                                <Button color="primary" type="submit" isDisabled={deletePending || createPending || editPending}>
                                    {createPending ? "Adding..." : "Add"}
                                </Button>
                            </div>
                        </form>
                    </ModalBody>
                </>
            )}
            </ModalContent>
        </Modal>
        <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} isDismissable={false}>
            <ModalContent>
            {(onClose) => {
                return <>
                    <ModalHeader className="flex flex-col gap-1">Editing '{selectedConnection?.name}'</ModalHeader>
                    <ModalBody>
                        <p>Edit a new network connection for <b>{system.hostname}</b></p>
                        <form className="flex flex-col gap-2" onSubmit={onEditSubmit} target="theTank">
                            <input type="hidden" hidden name="uuid" value={selectedConnection?.uuid} />
                            <Input required isRequired minLength={1} maxLength={32} name="ssid" label="SSID" variant="bordered" placeholder="MyCoolNetwork-1N1M1" defaultValue={selectedConnection?.name}></Input>
                            <Select required isRequired name="authtype" defaultSelectedKeys={[selectedConnection?.wifiSecurity.toLowerCase() ?? "wpa-psk"]} label="Authentication Type" variant="bordered" value={createAuthType} onChange={(e)=>{setCreateAuthType(e.target.value as any)}}>
                                <SelectItem value={"open"} key="open">OPEN (none)</SelectItem>
                                <SelectItem value={"wpa-psk"} key="wpa-psk">WPA (password)</SelectItem>
                                <SelectItem value={"wpa-eap"} key="wpa-eap">WPA-EAP (username & password)</SelectItem>
                            </Select>
                            {createAuthType === "wpa-psk" && <Input endContent={
                                    <button className="focus:outline-none" type="button" onClick={toggleVisibility} aria-label="toggle password visibility">
                                        {isVisible ? (
                                            <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                        ) : (
                                            <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                        )}
                                        </button>
                                    } required isRequired name="password" minLength={8} maxLength={63}  defaultValue={selectedConnection?.credentials?.password} autoComplete="current-password" label="Password" variant="bordered" type={isVisible ? "text" : "password"} placeholder="inimiHasThePass"></Input>}
                            {createAuthType === "wpa-eap" && <>
                                <Input required isRequired name="username" minLength={1} defaultValue={selectedConnection?.credentials?.username} autoComplete="username" label="Username" variant="bordered" type="text" placeholder="inimi"></Input>
                                <Input endContent={
                                    <button className="focus:outline-none" type="button" onClick={toggleVisibility} aria-label="toggle password visibility">
                                        {isVisible ? (
                                            <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                        ) : (
                                            <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                        )}
                                        </button>
                                    } required isRequired name="password" minLength={8} defaultValue={selectedConnection?.credentials?.password} maxLength={63} autoComplete="current-password" label="Password" variant="bordered" type="password" placeholder="inimiHasThePass"></Input>
                            </>}
                            <Spacer y={2} />
                            <Select required isRequired name="interface" defaultSelectedKeys={interfaces.map(a=>a.interface).includes(selectedConnection?.interface as string) ? [selectedConnection?.interface as string] : ["any"]} label="Network Interface" variant="bordered">
                                <SelectItem value={"any"} key="any">Any</SelectItem>
                                {...interfaces.map((netInterface: any, _:any) => {
                                    return <SelectItem value={netInterface.interface} key={netInterface.interface} textValue={`${netInterface.via}: ${netInterface.interface} (${netInterface.serial.toUpperCase()})`}>{netInterface.via}: <b>{netInterface.interface}</b> ({netInterface.serial.toUpperCase()})</SelectItem>
                                }) as any}
                            </Select>
                            <Spacer y={2} />
                            <CheckboxGroup size="sm"  name="settings" label="Settings" defaultValue={[...(editAutoconnect ? ["autoconnect"] : []), ...(editShowIPConf ? ["set-static"] : []), ...(selectedConnection?.hidden ? ["hidden"]:[])]}>
                                <Checkbox size="sm" name="set-static" value="set-static" onChange={(e)=>setEditShowIPConf(e.target.checked)}>Set a static IP address for this connection</Checkbox>
                                {editShowIPConf && <Input required isRequired minLength={7} size="sm" name="static-ip-addresses" label="Static IP Addresses (separate with commas)" variant="bordered" placeholder="192.168.1.63,10.53.223.4" defaultValue={selectedConnection?.static?.ips?.join(",")}></Input>}
                                {editShowIPConf && <Input required isRequired minLength={7} size="sm" name="static-gateway" label="Gateway Address" variant="bordered" placeholder="192.168.1.1" defaultValue={selectedConnection?.static?.gateway ?? ""}></Input>}
                                {editShowIPConf && <Input required isRequired minLength={7} size="sm" name="static-dns-servers" label="Static DNS Servers (separate with commas)" variant="bordered" placeholder="1.1.1.1,1.0.0.1" defaultValue={selectedConnection?.static.dns?.join(",")}></Input>}
                                <Checkbox size="sm" name="autoconnect" value="autoconnect" onChange={(e)=>setEditAutoconnect(e.target.checked)}>Automatically connect to this network when in range</Checkbox>
                                {editAutoconnect && <Input required isRequired minLength={1} maxLength={7} size="sm" name="autoconnect-priority" label="Priority" variant="bordered" type="number" placeholder="0" defaultValue={selectedConnection?.autoconnect.priority.toString() ?? "0"}></Input>}
                                {editAutoconnect && <Input required isRequired minLength={1} maxLength={7} size="sm" name="autoconnect-retries" label="Retries (-1 to try forever)" variant="bordered" type="number" placeholder="-1" defaultValue={selectedConnection?.autoconnect.retries.toString() ?? "-1"}></Input>}
                                <Checkbox size="sm" name="hidden" value="hidden" >This network is hidden (not broadcasting its SSID)</Checkbox>
                        
                            </CheckboxGroup>
                            <Spacer y={1.5} />
                            <Divider orientation="horizontal" />
                            <Spacer y={1.5} />
                            <p hidden={!selectedConnection?.connected} className="text-gray-400 text-center font-semibold text-sm"><b>{system.hostname}</b> will have to reconnect to the Wi-Fi network to apply the changes.<br/>You might lose connection temporarily.</p>
                            <div className="flex flex-row py-2 justify-end w-full">
                                <Button color="danger" variant="light" onClick={onClose} isDisabled={deletePending || createPending || editPending}>
                                    Cancel
                                </Button>
                                <Button color="primary" type="submit" isDisabled={deletePending || createPending || editPending}>
                                    {editPending ? "Editing..." : "Edit"}
                                </Button>
                            </div>
                        </form>
                    </ModalBody>
                </>
            }}
            </ModalContent>
        </Modal>
        </>
    )
}