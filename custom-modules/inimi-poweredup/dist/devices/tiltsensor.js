import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class TiltSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.TILT_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.TILT:
                const x = message.readInt8(this.isWeDo2SmartHub ? 2 : 4);
                const y = message.readInt8(this.isWeDo2SmartHub ? 3 : 5);
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
