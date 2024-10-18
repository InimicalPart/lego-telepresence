import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class MoveHubTiltSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.MOVE_HUB_TILT_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.TILT:
                const x = -message.readInt8(4);
                const y = message.readInt8(5);
                this.notify("tilt", { x, y });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["TILT"] = 0] = "TILT";
})(Mode || (Mode = {}));
export const ModeMap = {
    "tilt": Mode.TILT
};
