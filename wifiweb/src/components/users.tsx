"use client"

import UserPrivileges, { Descriptions, FriendlyNames, Privileges } from "@/lib/privileges"
import { Card, CardHeader, CardBody, CardFooter, Button, useDisclosure, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Input, SelectItem, Select, Spacer, Chip, Divider, Tooltip } from "@nextui-org/react"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { toast } from "sonner"
import { UsersTable } from "./usersTable"
import { useState } from "react"

export default function Users({
    user,
    privileges
}: {
    user: any,
    privileges: UserPrivileges
}) {
    const {isOpen: isCreateUserOpen, onClose: onCreateUserClose, onOpen: onCreateUserOpen, onOpenChange: OnCreateUserOpenChange} = useDisclosure();
    const {isOpen: isUserCreatedOpen, onClose: onUserCreatedClose, onOpen: onOpenUserCreated, onOpenChange: onOpenUserCreatedChange} = useDisclosure();


    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [password, setPassword] = useState<string | null>(null);
    const [privs, setPrivs] = useState<any>(new Set([]));
    const [submitting, setSubmitting] = useState<boolean>(false);

    function onFormSubmit(e: any) {
        e.preventDefault();
        setSubmitting(true)
        const prives = Array.from(privs as Set<string>).map((priv: string) => Privileges[priv as keyof typeof Privileges]).reduce((a: number, b: number) => a | b, 0) ?? 0

        console.log(e.target.username.value, e.target.password.value, prives)

        const form = new FormData(e.target)

        form.set("privileges", prives.toString())

        console.log(form)

        fetch("/api/v1/user", {
            method: "POST",
            body: form
        }).then(async (res) => {
            const json = await res.json()
            if (res.status !== 200) {
                toast.error("Failed to create user")
                
                switch (json.error) {
                    case "ALREADY_TAKEN":
                        setUsernameError("This username is already taken");
                        break;
                    case "PASS_INVALID_LENGTH":
                        setPasswordError("Password must be between 5 and 64 characters");
                        break;
                    case "INVALID_USER":
                        setUsernameError("Invalid username");
                        break;
                    case "INVALID_PASSWORD":
                        setPasswordError("Invalid password");
                        break;
                    default:
                        break;
                }
             
                throw new Error("Failed to create user")
            }
            return json
        }).then(async (data) => {
            if (data.password) {
                setUsername(data.user)
                setPassword(data.password)
                onCreateUserClose()
                onOpenUserCreated()
                window.dispatchEvent(new CustomEvent("WW-UsersTable", {
                    detail: {
                        type: "refresh"
                    }
                }))
            } else {
                toast.success("User Created", {
                    description: `User ${data.user} has successfully been created`,
                    duration: 5000
                })
                onCreateUserClose()
                window.dispatchEvent(new CustomEvent("WW-UsersTable", {
                    detail: {
                        type: "refresh"
                    }
                }))
            }
            setSubmitting(false)
        }).catch((e) => {
            setSubmitting(false)
        })
        
    }

    return (
        <>
            <Card className={`h-[48.75rem] w-[30rem] flex ${!privileges.has(Privileges.MANAGE_USERS) ? "hidden" : ""}`}>
                <CardHeader className="flex flex-row justify-between items-center font-bold gap-2">
                    <p className="!justify-self-center ml-2">Users</p>
                </CardHeader>
                <CardBody>
                <ScrollArea>
                    <UsersTable currentUser={user} />
                </ScrollArea>
                </CardBody>
                <CardFooter>
                    <div className="flex flex-col gap-2 justify-center items-center w-full">
                        <Button variant="flat" color="primary" className="w-full mx-5" onClick={()=>onCreateUserOpen()}>Create a new user</Button>
                        <Button variant="flat" color="danger" className="w-full mx-5" onClick={()=>window.location.href = "/login?logout=true"}>Log Out (logged in as {user})</Button>

                    </div>
                </CardFooter>
            </Card>
            <Modal isOpen={isCreateUserOpen} onOpenChange={OnCreateUserOpenChange}>
                <ModalContent>
                {(onClose) => (
                    <>
                    <ModalHeader className="flex flex-col gap-1">Create a User</ModalHeader>
                    <ModalBody>
                        <form onSubmit={onFormSubmit} target="theTank" className="flex flex-col gap-2">
                            <Input onValueChange={(e)=>{
                                if (!e) {
                                    setUsernameError("Username cannot be empty")
                                } else if (e.match(/[^a-z0-9]/)) {
                                    setUsernameError("Username can only contain lowercased letters and numbers")
                                } else if (e.length<3 || e.length>64) {
                                    setUsernameError("Username must be between 3 and 64 characters")
                                } else {
                                    setUsernameError(null)
                                }
                                setUsername(e)
                            }} autoComplete="username" errorMessage={usernameError} isInvalid={!!usernameError} required isRequired minLength={3} maxLength={64} name="username" label="Username" variant="bordered" placeholder="inimi"></Input>
                            <Input onValueChange={(e)=>{
                                if ((e.length<5 || e.length>64) && !!e) {
                                    setPasswordError("Password must be between 5 and 64 characters")
                                } else {
                                    setPasswordError(null)
                                }
                                
                                setPassword(e)
                            }} autoComplete="current-password" errorMessage={passwordError} isInvalid={!!passwordError} minLength={5} maxLength={64} name="password" label="Password (optional)" variant="bordered" placeholder="1N#M@IZ7-EB3$!" type="password"></Input>
                            <Spacer y={2} />
                            <Select
                                label="Privileges"
                                selectionMode="multiple"
                                placeholder="Select privileges"
                                onSelectionChange={setPrivs}
                                name="privileges"
                            >
                                {Object.keys(Privileges).filter(a=>!!isNaN(a as any)).map((priv, i) => (
                                    <SelectItem key={priv} aria-label={FriendlyNames[Privileges[priv as keyof typeof Privileges]]}>
                                        <Tooltip showArrow placement="left" offset={20} content={<div className="max-w-[400px]">
                                            <Chip key={i} color={priv == "ROOT" ? "danger" : "primary"} variant="flat" size="md">
                                                {FriendlyNames[Privileges[priv as keyof typeof Privileges]]}
                                            </Chip>
                                            <Spacer y={1}/>
                                            <Divider orientation="horizontal" />
                                            <Spacer y={1}/>
                                            <p>{Descriptions[Privileges[priv as keyof typeof Privileges]]}</p>
                                        </div>} key={i}>
                                            <div className="w-full">
                                                <Chip key={i} color={priv == "ROOT" ? "danger" : "primary"} variant="flat" size="sm">
                                                    {FriendlyNames[Privileges[priv as keyof typeof Privileges]]}
                                                </Chip>
                                            </div>
                                        </Tooltip>
                                    </SelectItem>
                                ))}
                            </Select>
                        <Spacer y={5} />
                        <Button color="primary" isDisabled={!!submitting || !!usernameError || !!passwordError || !username} type="submit" >
                            {submitting ? "Creating..." : "Create"}
                        </Button>
                    </form>
                    </ModalBody>
                    </>
                )}
                </ModalContent>
            </Modal>

            <Modal isOpen={isUserCreatedOpen} onOpenChange={onOpenUserCreatedChange}>
                <ModalContent>
                    {() => (
                        <>
                            <ModalHeader className="font-normal"><p>Account created for <b>{username}</b>!</p></ModalHeader>
                            <ModalBody className="flex flex-col text-center items-center justify-center">
                                <p><b>{username}</b>'{username?.endsWith("s") ? "":"s"} account has been created! Since you didn't specify a password, we chose one for you!</p>
                                <p className="text-lg font-bold">{password}</p>
                            </ModalBody>
                            <ModalFooter className="justify-center">
                                <Button variant="flat" color="primary" onClick={()=>{
                                    setPassword(null);
                                    onCreateUserClose();
                                    onUserCreatedClose();
                                }} className="w-[80%]">
                                    Done
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>

    )
}