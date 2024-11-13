"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "./icons";


export default function HeaderAlert() {

    const [title, setTitle] = useState("");
    const [color, setColor] = useState("#000000");
    const [showAlert, setShowAlert] = useState(true);

    const [alertQueue, setAlertQueue] = useState<any[]>([]);

    useEffect(() => {

        function onMessage(event: any) {
            const { type, title: internalTitle, color, force } = event.detail;
            if (type === "alert") {
                if (showAlert && !force) {
                    setAlertQueue([...alertQueue, {title: internalTitle, color}]);
                    return;
                }
                setTitle(internalTitle);
                setColor(color);
                setShowAlert(true);
            } else if (type === "hide") {
                if (force) {
                    setShowAlert(false);
                } else {
                    if (alertQueue.length > 0) {
                        const { title:internalTitle2, color } = alertQueue.shift();
                        setTitle(internalTitle2);
                        setColor(color);
                        setShowAlert(true);
                        setAlertQueue([...alertQueue]);
                    } else {
                        setShowAlert(false);
                    }
                }
            } else if (type === "clearWithTitle") {
                if (title === internalTitle) {
                    onMessage({detail: {type: "hide", force}});
                } else if (alertQueue.length > 0) {
                    setAlertQueue(alertQueue.filter((item) => item.title !== internalTitle));
                }
            }
        }

        window.addEventListener("header-alert-message", onMessage);

        return () => {
            window.removeEventListener("header-alert-message", onMessage);
        }
    },[alertQueue, showAlert, title]);


    function onClose() {
        if (alertQueue.length > 0) {
            const { title, color } = alertQueue.shift();
            setTitle(title);
            setColor(color);
            setShowAlert(true);
            setAlertQueue([...alertQueue]);
        } else {
            setShowAlert(false);
        }
    }

    function getLuminance(hex: string) {
        var c = hex.startsWith("#") ? hex.substring(1) : hex;
        var rgb = parseInt(c, 16);
        var r = (rgb >> 16) & 0xff;
        var g = (rgb >>  8) & 0xff;
        var b = (rgb >>  0) & 0xff;

        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        return luma;
    }


    return (
        <div className={`relative top-0 left-0 w-full max-h-10 h-10 header-alert ${!showAlert ? "hide" : ""} ${!title ? "hidden" : ""}`} style={{backgroundColor: color}}>
            <div className={`flex text-center justify-center items-center h-full w-full absolute header-text ${!showAlert ? "hide" : ""}`}>
                <h1 className={`relative ${getLuminance(color) < 128 ? "text-white" : "text-black"} z-10`}>{title}</h1>
            </div>
            <div className={`absolute h-full w-full flex items-center justify-end right-2 header-text ${!showAlert ? "hide" : ""} ${!title ? "hidden" : ""}`}>
                <button onClick={onClose} disabled={!showAlert} className="z-10">
                    <XMarkIcon size={16} className={`absolute ${getLuminance(color) < 128 ? "text-white" : "text-black"}`}/>
                </button>
            </div>
        </div>
    );
}