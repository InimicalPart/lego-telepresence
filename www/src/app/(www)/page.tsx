import { Battery, Camera, Car, Computer, X } from "@/components/icons"
import { LTPGlobal } from "@/interfaces/global"
import { card, Divider, Tooltip } from "@nextui-org/react"

import { useState } from "react"

import "@/styles/pulse-dot.css"
import BatteryFetcher from "@/components/batteryFetcher"
declare const global: LTPGlobal

export default async function Home() {
    const exCar = global.connections.find(conn=>!!conn.car)
    const exCamera = global.connections.filter(conn=>!!conn.cam).find(conn=>conn.cam?.serialNumber === exCar?.car?.cameraSerial)
    const carHost = (!!exCar ? await exCar.connection.sendAndAwait({type: "system"}) : null)
    const camHost = (!!exCamera ? await exCamera.connection.sendAndAwait({type: "system"}) : carHost)

    const model = carHost?.model == camHost?.model ? carHost?.model : "Unknown - Mismatch"
    const hostname = carHost?.hostname == camHost?.hostname ? carHost?.hostname : "Unknown - Mismatch"
    const osName = carHost?.os == camHost?.os ? carHost?.os : "Unknown - Mismatch"

    console.log(exCar)
    console.log(exCamera)
    console.log(model)


    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                border: "1px solid black",
                width: "fit-content",
                padding: 20,
                borderRadius: "16px"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 7.5
                }}>            
                    <div className="dot"/>
                    <Car size={16}/>
                    <p className="font-extrabold">{exCar?.car?.name} - {exCar?.car?.MACAddress}</p>
                </div>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    margin:10,
                }}>

                    <div style={{display:"flex", flexDirection:"row", gap:5}}><b>Firmware:</b> <p>{exCar?.car?.firmwareVersion}</p></div>
                    <div style={{display:"flex", flexDirection:"row", gap:5}}><b>Hardware:</b> <p>{exCar?.car?.hardwareVersion}</p></div>
                    <div style={{display:"flex", flexDirection:"row", gap:5}}><b>Camera S/N:</b> <p>{exCar?.car?.cameraSerial}</p></div>
                </div>
                <div style={{ position: 'relative', width: '100%', marginTop: 5, marginBottom: 15 }}>
                    <div style={{
                        position: 'absolute',
                        width: "100%",
                        height: 90,
                        zIndex: -10,
                        // borderLeft: "2px dotted black",
                        // borderRight: "2px dotted black",
                        borderWidth: "1.75px",
                        borderStyle: "dotted",
                        borderImage:"linear-gradient(to top, rgb(0,0,0), rgba(0, 0, 0, 0)) 1 100%",
                        boxShadow: "0px 20px 20px 0px rgba(0, 0, 0, .1)",
                        bottom:0
                    }}></div>
                    <hr style={{
                        width: "100%",
                        height: 2,
                        backgroundColor: "black",
                        border: "none",
                        position: "relative",
                        zIndex: 1,
                    }}/>
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-60%)',
                        width: 0,
                        height: 0,
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderTop: '10px solid black',
                        zIndex: 2,
                    }}></div>
                </div>
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10
                }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <Tooltip showArrow={true} content={
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                            }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flexDirection: "row",
                                    gap:7.5
                                }}>
                                    <Camera size={16} color="white"/>
                                    <p className="font-extrabold">{exCamera?.cam?.name ?? "No camera attached."}</p>
                                </div>
                                <Divider orientation="horizontal" style={{backgroundColor: "white", margin: 10}} hidden={!exCamera}/>
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    gap: 5
                                }}>
                                {!!exCamera && (
                                        <>
                                        <div style={{display:"flex", flexDirection:"row", gap:5}}><b>MAC:</b> <p>{exCamera.cam?.MACAddress}</p></div>
                                        <div style={{display:"flex", flexDirection:"row", gap:5}}><b>Model:</b> <p>{exCamera.cam?.modelNumber}</p></div>
                                        <div style={{display:"flex", flexDirection:"row", gap:5}}><b>S/N:</b> <p>{exCamera.cam?.serialNumber}</p></div>
                                        <div style={{display:"flex", flexDirection:"row", gap:5}}><b>Firmware:</b> <p>{exCamera.cam?.firmwareVersion}</p></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        }
                              classNames={{
                                base: [
                                  // arrow color
                                  "before:bg-neutral-700 dark:before:bg-black",
                                ],
                                content: [
                                  "py-2 px-4 shadow-xl",
                                  "text-white bg-neutral-900",
                                ],
                              }}
                        >
                            <Camera size={20}/>
                        </Tooltip>
                        
                        {!!exCamera ?
                            <BatteryFetcher id={exCamera?.id ?? ""} asIcon/> :
                            <X size={24} color={"darkred"}/>
                        }
                    </div>
                    <Divider orientation="vertical"/>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <Car size={20}/>
                        <BatteryFetcher id={exCar?.id ?? ""} asIcon/>
                    </div>
                    <Divider orientation="vertical"/>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <Tooltip showArrow={true} content={
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                            }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flexDirection: "row",
                                    gap:7.5
                                }}>
                                    <Computer size={16} color="white"/>
                                    <p className="font-extrabold">{hostname}</p>
                                </div>
                                <Divider orientation="horizontal" style={{backgroundColor: "white", margin: 10}}/>
                                    <div style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        gap: 5
                                    }}>
                                        <div style={{display:"flex", flexDirection:"row", gap:5}}><b>Model:</b> <p>{model}</p></div>
                                        <div style={{display:"flex", flexDirection:"row", gap:5}}><b>OS Name:</b> <p>{osName}</p></div>
                                    </div>
                            </div>
                        }
                              classNames={{
                                base: [
                                  // arrow color
                                  "before:bg-neutral-700 dark:before:bg-black",
                                ],
                                content: [
                                  "py-2 px-4 shadow-xl",
                                  "text-white bg-neutral-900",
                                ],
                              }}
                        >

                            <Computer size={20}/>
                        </Tooltip>
                        <p className="font-extrabold">N/A</p>
                    </div>
                </div>
            </div>
        </div>
    )
}