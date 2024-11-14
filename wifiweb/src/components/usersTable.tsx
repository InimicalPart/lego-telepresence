"use client"

import UserPrivileges, { Descriptions, FriendlyNames, Privileges } from "@/lib/privileges";
import { Button, Chip, Divider, getKeyValue, Modal, Input, ModalBody, ModalContent, ModalFooter, ModalHeader, Skeleton, Spacer, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure } from "@nextui-org/react";
import { useCallback, useEffect, useState } from "react";
import { DeleteUserIcon, EditUserIcon, EyeFilledIcon, EyeIcon, EyeSlashFilledIcon } from "./icons";
import { toast } from "sonner"
import { AlertPresets } from "@/lib/alertPresets";

export function UsersTable( {currentUser}:{currentUser: any} ) {

    const [users, setUsers] = useState<any[]|null>(null);
    const {isOpen: isEditOpen, onClose: onCloseEdit, onOpen: onOpenEdit, onOpenChange: onOpenEditChange} = useDisclosure();
    const {isOpen: isChangePassOpen, onClose: onCloseChangePass, onOpen: onOpenChangePass, onOpenChange: onOpenChangePassChange} = useDisclosure();
    const {isOpen: isResetPassOpen, onClose: onCloseResetPass, onOpen: onOpenResetPass, onOpenChange: onOpenResetPassChange} = useDisclosure();

    const [currentPass, setCurrentPass] = useState<any>(null);
    const [currentPassVisible, setCurrentPassVisible] = useState<boolean>(false);
    const [currentPassError, setCurrentPassError] = useState<string|null>(null);
    const [newPass, setNewPass] = useState<any>(null);
    const [newPassVisible, setNewPassVisible] = useState<boolean>(false);
    const [newPassError, setNewPassError] = useState<string|null>(null);
    const [verifiedPass, setVerifiedPass] = useState<any>(null);
    const [verifiedPassVisible, setVerifiedPassVisible] = useState<boolean>(false);
    const [verifiedPassError, setVerifiedPassError] = useState<string|null>(null);


    const [changingPassword, setChangingPassword] = useState<boolean>(false);
    const [resettingPassword, setResettingPassword] = useState<boolean>(false);
    const [deletingUser, setDeletingUser] = useState<boolean>(false);


    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(()=>{

        function onMessage(event: any) {
            if (event.detail.type === "refresh") {
                setUsers(null);
                fetch("/api/v1/users").then(async (res)=>{
                    const data = await res.json();
                    setUsers(data);
                })
            }
        }

        window.addEventListener("WW-UsersTable", onMessage);

        fetch("/api/v1/users").then(async (res)=>{
            const data = await res.json();
            setUsers(data);
        })

        return () => {
            window.removeEventListener("WW-UsersTable", onMessage);
        }
    }, [])

    function onResetPasswordSubmit(e: any) {
        e.preventDefault();
        setResettingPassword(true);
        fetch(`/api/v1/users/${e.target.uuid.value}`, {
            method: "PATCH",
        }).then(async (res)=>{
            const data = await res.json();
            if (!data.error) {
                setResettingPassword(false);
                toast.success("Password reset successfully", {
                    duration:5000
                });
                setNewPass(data.newPass);
                onOpenResetPass();
            } else {
                toast.error("An error occurred", {
                    description: data.message ?? data.error,
                    duration:5000
                });
            }
        })


    }

    function onDeleteUserSubmit(e: any) {
        e.preventDefault();
        setDeletingUser(true);
        fetch(`/api/v1/users/${e.target.uuid.value}`, {
            method: "DELETE",
        }).then(async (res)=>{
            const data = await res.json();
            if (res.status != 200) throw new Error(data.message ?? data.error);
            if (!data.error) {
                setDeletingUser(false);
                toast.success("User Deleted", {
                    duration:5000
                });
                window.dispatchEvent(new CustomEvent("WW-UsersTable", {
                    detail: {
                        type: "refresh"
                    }
                }));
            } else {
                toast.error("An error occurred", {
                    description: data.message ?? data.error,
                    duration:5000
                });
                setDeletingUser(false);
            }
        }).catch((e)=>{
            toast.error("An error occurred", {
                description: e.message,
                duration:5000
            });
            setDeletingUser(false);
        })
    }

    function onChangePasswordSubmit(e: any) {
        e.preventDefault();
        setChangingPassword(true);
        fetch("/api/v1/users/@me", {
            method: "PATCH",
            body: new FormData(e.target)
        }).then(async (res)=>{
            const data = await res.json();
            if (!data.error) {
                setCurrentPass(null);
                setNewPass(null);
                setVerifiedPass(null);
                setCurrentPassError(null);
                setNewPassError(null);
                setVerifiedPassError(null);
                setChangingPassword(false);
                window.dispatchEvent(new CustomEvent("header-alert-message", {
                    detail: {
                        type: "clearWithTitle",
                        title: AlertPresets.DEFAULT_PASS.title
                    }
                }));
                toast.success("Password changed successfully", {
                    duration:5000
                });
                onCloseChangePass();
                onCloseEdit();
            } else {
                if (data.error == "NO_MATCH") {
                    setCurrentPassError("Password does not match");
                    setChangingPassword(false);
                }
            }
        })
    }

    const renderCell = useCallback((user:{
        manageable: any;
        username: string,
        privileges: number,
        uuid: string
    }, columnKey: keyof typeof user) => {
    
        const cellValue = user[columnKey]

        switch (columnKey as any) {
          case "username":
            return (
              <>{user.username}</>
            );
          case "privileges":
            return (<div className="flex flex-wrap gap-1">{
              new UserPrivileges(user.privileges).toStringArray().map((privilege, i) => (
                <Tooltip content={<div className="max-w-[400px]">
                    <Chip key={i} color={privilege == "ROOT" ? "danger" : "primary"} variant="flat" size="md">
                        {FriendlyNames[Privileges[privilege as keyof typeof Privileges]]}

                    </Chip>
                    <Spacer y={1}/>
                    <Divider orientation="horizontal" />
                    <Spacer y={1}/>
                    <p>{Descriptions[Privileges[privilege as keyof typeof Privileges]]}</p>
                </div>} key={i}>
                    <Chip key={i} color={privilege == "ROOT" ? "danger" : "primary"} variant="flat" size="sm">
                        {FriendlyNames[Privileges[privilege as keyof typeof Privileges]]}
                    </Chip>
                </Tooltip>
              ))}
           </div>);
          case "actions":
            return (
              <div className="relative flex items-center gap-2 justify-center">
                <Tooltip showArrow content={!user.manageable ? "You cannot edit this user.": "Edit user"}>
                    <button onClick={()=>{
                        setSelectedUser(user);
                        onOpenEdit();
                    }} disabled={!user.manageable} className={`text-lg text-default-400 ${!user.manageable ? "cursor-not-allowed" : "active:opacity-50"}`}>
                        <EditUserIcon style={{opacity: !user.manageable ? 0.5 : 1}}/>
                    </button>
                </Tooltip>
                <Tooltip showArrow content={user.username == currentUser ? "You cannot delete yourself.": "Delete user"}>
                    <form onSubmit={onDeleteUserSubmit} target="theTank">
                        <input type="hidden" name="uuid" value={user.uuid} />
                            <button type="submit" disabled={user.username == currentUser || !!deletingUser} className={`text-lg text-danger ${user.username == currentUser || !!deletingUser ? "cursor-not-allowed" : "active:opacity-50"}`} >
                                <DeleteUserIcon style={{opacity: user.username == currentUser || !!deletingUser ? 0.5 : 1}}/>
                            </button>
                        </form>
                </Tooltip>
              </div>
            );
          default:
            return cellValue;
        }
      },[currentUser]);


    const columns = [
        {
            key: "username",
            label: "USERNAME",
        },
        {
            key: "privileges",
            label: "PRIVILEGES",
        },
        {
            key: "actions",
            label: "ACTIONS",
        },
    ]

    return (
        <>
            <Table classNames={{
                wrapper: "bg-neutral-800",
                th: "bg-neutral-700 text-neutral-400",
            }} aria-label="Users table">
                <TableHeader columns={columns}>
                    {(column) => (
                    <TableColumn key={column.key} align={column.key === "actions" ? "center" : "start"}>
                        {column.label}
                    </TableColumn>
                    )}
                </TableHeader>
                    <TableBody items={users ?? []} loadingContent={<Spinner/>} isLoading={users==null||currentUser==null}>
                        {(item) => (
                            <TableRow key={item.uuid}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey as any)}</TableCell>}
                            </TableRow>
                        )}
                </TableBody>
            </Table>
            <Modal isOpen={isEditOpen} onOpenChange={onOpenEditChange} isDismissable={!changingPassword || !resettingPassword} isKeyboardDismissDisabled={changingPassword || resettingPassword}>
                <ModalContent>
                    {(onClose) => (
                        <>
                        <ModalHeader className="font-normal"><p>Editing User: <b>{selectedUser.username}</b></p></ModalHeader>
                        <ModalBody>
                            <div className="flex flex-col gap-2">
                                <span><b>UUID:</b> {selectedUser.uuid}</span>
                                <span><b>Username:</b> {selectedUser.username}</span>
                                <span><b>Privileges:</b> {!selectedUser.privileges ? "NONE" : <div className="inline-flex gap-1 flex-wrap">{
                                    new UserPrivileges(selectedUser.privileges).toStringArray().map((privilege, i) => (
                                        <Tooltip content={<div className="max-w-[400px]">
                                            <Chip key={i} color={privilege == "ROOT" ? "danger" : "primary"} variant="flat" size="md">
                                                {FriendlyNames[Privileges[privilege as keyof typeof Privileges]]}
                                            </Chip>
                                            <Spacer y={1}/>
                                            <Divider orientation="horizontal" />
                                            <Spacer y={1}/>
                                            <p>{Descriptions[Privileges[privilege as keyof typeof Privileges]]}</p>
                                        </div>} key={i}>
                                            <Chip key={i} color={privilege == "ROOT" ? "danger" : "primary"} variant="flat" size="sm">
                                                {FriendlyNames[Privileges[privilege as keyof typeof Privileges]]}
                                            </Chip>
                                        </Tooltip>
                                    ))
                                }</div>}
                                </span>
                                <span className="flex-row flex gap-1"><b>Created at:</b>
                                    <Tooltip content={new Date(selectedUser.createdAt).toString()}>
                                            {new Date(selectedUser.createdAt).toLocaleString()}
                                    </Tooltip>
                                </span>
                                <span className="flex-row flex gap-1"><b>Created by:</b>
                                    <Tooltip showArrow hidden={selectedUser.createdBy !== "SYSTEM"} content={<div className="max-w-[400px]">
                                        <b className="text-medium">SYSTEM</b>
                                        <Spacer y={1}/>
                                        <Divider orientation="horizontal" />
                                        <Spacer y={1}/>
                                        <p>The <b>SYSTEM</b> user is a "system-level-only" user that is created when the system is initialized. WiFiWeb uses the <b>SYSTEM</b> account to perform operations like a user.</p>
                                    </div>}>{selectedUser.createdBy}</Tooltip>
                                </span>
                            </div>
                            <form onSubmit={onResetPasswordSubmit} className="w-full">
                                <input type="hidden" name="uuid" value={selectedUser.uuid} />
                                <Button variant="flat" color="danger" type="submit" className={`${selectedUser.username == currentUser ? "hidden" : ""} w-full`} isDisabled={resettingPassword}>
                                        {resettingPassword ? "Resetting..." : "Reset User Password"}
                                </Button>
                            </form>
                            <Button variant="flat" color="default" className={selectedUser.username != currentUser ? "hidden" : ""} onClick={()=>onOpenChangePass()}>
                                Change Password
                            </Button>
                        </ModalBody>
                        <ModalFooter className="justify-center">
                            <Button variant="flat" color="primary" onClick={onClose} className="w-[80%]">
                                Done 
                            </Button>
                        </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <Modal isOpen={isChangePassOpen} onOpenChange={onOpenChangePassChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="font-normal flex flex-col justify-start gap-1">
                                Change Password
                                <sub className="text-gray-400">Changing password for <b>{currentUser}</b></sub>    
                            </ModalHeader>
                            <ModalBody>
                                <form className="flex flex-col gap-2" onSubmit={onChangePasswordSubmit}>
                                    <Input errorMessage={currentPassError} isInvalid={!!currentPassError} endContent={
                                        <button tabIndex={-1} className="focus:outline-none" type="button" onClick={()=>setCurrentPassVisible(!currentPassVisible)} aria-label="toggle password visibility">
                                            {currentPassVisible ? (
                                                <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                            ) : (
                                                <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                            )}
                                            </button>
                                        } required isRequired onValueChange={(e)=>{
                                            
                                            if (currentPassError) {
                                                setCurrentPassError(null);
                                            }
                                            
                                            setCurrentPass(e)
                                        }} minLength={1} name="current-password" type={currentPassVisible ? "text" : "password"} label="Current Password" variant="bordered"></Input>
                                    <Spacer y={2}/>
                                    <Input errorMessage={newPassError} isInvalid={!!verifiedPassError || !!newPassError} endContent={
                                        <button tabIndex={-1} className="focus:outline-none" type="button" onClick={()=>setNewPassVisible(!newPassVisible)} aria-label="toggle password visibility">
                                            {newPassVisible ? (
                                                <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                            ) : (
                                                <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                            )}
                                            </button>
                                        } required isRequired onValueChange={(e)=>{
                                        
                                            if (e !== verifiedPass && !!verifiedPass) {
                                                setVerifiedPassError("Passwords do not match");
                                            } else {
                                                setVerifiedPassError(null);
                                            }
                                            
                                            setNewPass(e)
                                        }} minLength={1} maxLength={64} name="new-password" type={newPassVisible ? "text" : "password"} label="New Password" variant="bordered"></Input>
                                    <Input errorMessage={verifiedPassError} isInvalid={!!verifiedPassError} endContent={
                                        <button tabIndex={-1} className="focus:outline-none" type="button" onClick={()=>setVerifiedPassVisible(!verifiedPassVisible)} aria-label="toggle password visibility">
                                            {verifiedPassVisible ? (
                                                <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                            ) : (
                                                <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                                            )}
                                            </button>
                                        } required isRequired onValueChange={(e)=>{
                                        
                                            if (e !== newPass) {
                                                setVerifiedPassError("Passwords do not match");
                                            } else {
                                                setVerifiedPassError(null);
                                            }
                                            
                                            setVerifiedPass(e)
                                        }} minLength={1} maxLength={64} type={verifiedPassVisible ? "text" : "password"} label="Verify Password" variant="bordered"></Input>
                                    
                                    
                                    
                                    <Button variant="flat" type="submit" color="primary" className="w-full mt-5" isDisabled={
                                        !currentPass || !newPass || !verifiedPass ||

                                        !!currentPassError || !!newPassError || !!verifiedPassError ||

                                        changingPassword
                                    }>
                                        {changingPassword ? "Changing..." : "Change"}
                                    </Button>
                                </form>
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <Modal isOpen={isResetPassOpen} onOpenChange={onOpenResetPassChange} onClose={()=>setNewPass(null)}>
                <ModalContent>
                    {(onClose) => (
                        <>
                        <ModalHeader className="font-normal"><p>Password reset for <b>{selectedUser.username}</b></p></ModalHeader>
                        <ModalBody className="flex flex-col text-center items-center justify-center">
                            <p><b>{selectedUser.username}</b>'{selectedUser.username.endsWith("s") ? "":"s"} password has been reset! Here is their new password:</p>
                            <p className="text-lg font-bold">{newPass}</p>
                        </ModalBody>
                        <ModalFooter className="justify-center">
                            <Button variant="flat" color="primary" onClick={()=>{
                                setNewPass(null);
                                onClose();
                                onCloseEdit();
                            }} className="w-[80%]">
                                Done
                            </Button>
                        </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

        </>

      );
    
}