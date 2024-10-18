import { Device } from "./device.js";
import * as Consts from "../consts.js";
import { parseColor } from "../utils.js";
export class DuploTrainBaseColorSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.DUPLO_TRAIN_BASE_COLOR_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.INTENSITY:
                const intensity = message[4];
                this.notify("intensity", { intensity });
                break;
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
            case Mode.RGB:
                const red = Math.floor(message.readUInt16LE(4) / 4);
                const green = Math.floor(message.readUInt16LE(6) / 4);
                const blue = Math.floor(message.readUInt16LE(8) / 4);
                this.notify("rgb", { red, green, blue });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["INTENSITY"] = 0] = "INTENSITY";
    Mode[Mode["COLOR"] = 1] = "COLOR";
    Mode[Mode["REFLECTIVITY"] = 2] = "REFLECTIVITY";
    Mode[Mode["RGB"] = 3] = "RGB";
})(Mode || (Mode = {}));
export const ModeMap = {
    "intensity": Mode.INTENSITY,
    "color": Mode.COLOR,
    "reflect": Mode.REFLECTIVITY,
    "rgb": Mode.RGB
};
