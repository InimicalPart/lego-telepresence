import { Device } from "./device.js";
import * as Consts from "../consts.js";
import { parseColor } from "../utils.js";
export class TechnicColorSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.TECHNIC_COLOR_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.COLOR:
                if (message[4] <= 10) {
                    const color = parseColor(message[4]);
                    this.notify("color", { color });
                }
                break;
            case Mode.REFLECTIVITY:
                const reflect = message[4];
                this.notify("reflect", { reflect });
                break;
            case Mode.AMBIENT_LIGHT:
                const ambient = message[4];
                this.notify("ambient", { ambient });
                break;
        }
    }
    setBrightness(firstSegment, secondSegment, thirdSegment) {
        this.writeDirect(0x03, Buffer.from([firstSegment, secondSegment, thirdSegment]));
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["COLOR"] = 0] = "COLOR";
    Mode[Mode["REFLECTIVITY"] = 1] = "REFLECTIVITY";
    Mode[Mode["AMBIENT_LIGHT"] = 2] = "AMBIENT_LIGHT";
})(Mode || (Mode = {}));
export const ModeMap = {
    "color": Mode.COLOR,
    "reflect": Mode.REFLECTIVITY,
    "ambient": Mode.AMBIENT_LIGHT
};
