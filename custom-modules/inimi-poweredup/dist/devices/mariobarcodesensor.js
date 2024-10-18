import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class MarioBarcodeSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.MARIO_BARCODE_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.BARCODE:
                const barcode = message.readUInt16LE(4);
                const color = message.readUInt16LE(6);
                if (color === 0xffff) {
                    this.notify("barcode", { barcode });
                }
                else if (barcode === 0xffff) {
                    this.notify("barcode", { color });
                }
                break;
            case Mode.RGB:
                const r = message[4];
                const g = message[5];
                const b = message[6];
                this.notify("rgb", { r, g, b });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["BARCODE"] = 0] = "BARCODE";
    Mode[Mode["RGB"] = 1] = "RGB";
})(Mode || (Mode = {}));
export const ModeMap = {
    "barcode": Mode.BARCODE,
    "rgb": Mode.RGB,
};
