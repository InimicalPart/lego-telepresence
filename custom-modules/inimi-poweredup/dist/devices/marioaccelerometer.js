import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class MarioAccelerometer extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.MARIO_ACCELEROMETER);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.ACCEL:
                const x = message[4];
                const y = message[5];
                const z = message[6];
                this.notify("accel", { x, y, z });
                break;
            case Mode.GEST:
                const gesture = message[4];
                this.notify("gesture", { gesture });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["ACCEL"] = 0] = "ACCEL";
    Mode[Mode["GEST"] = 1] = "GEST";
})(Mode || (Mode = {}));
export const ModeMap = {
    "accel": Mode.ACCEL,
    "gesture": Mode.GEST,
};
