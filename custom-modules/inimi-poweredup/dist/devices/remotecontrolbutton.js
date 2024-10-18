import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class RemoteControlButton extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.REMOTE_CONTROL_BUTTON);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.BUTTON_EVENTS:
                const event = message[4];
                this.notify("remoteButton", { event });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["BUTTON_EVENTS"] = 0] = "BUTTON_EVENTS";
})(Mode || (Mode = {}));
export const ModeMap = {
    "remoteButton": Mode.BUTTON_EVENTS
};
export const ButtonState = {
    "UP": 0x01,
    "DOWN": 0xff,
    "STOP": 0x7f,
    "RELEASED": 0x00,
};
