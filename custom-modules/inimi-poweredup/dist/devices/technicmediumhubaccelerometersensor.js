import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class TechnicMediumHubAccelerometerSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.TECHNIC_MEDIUM_HUB_ACCELEROMETER);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.ACCEL:
                const x = Math.round(message.readInt16LE(4) / 4.096);
                const y = Math.round(message.readInt16LE(6) / 4.096);
                const z = Math.round(message.readInt16LE(8) / 4.096);
                this.notify("accel", { x, y, z });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["ACCEL"] = 0] = "ACCEL";
})(Mode || (Mode = {}));
export const ModeMap = {
    "accel": Mode.ACCEL
};
