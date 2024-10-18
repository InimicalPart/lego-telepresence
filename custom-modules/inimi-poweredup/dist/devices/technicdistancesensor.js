import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class TechnicDistanceSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.TECHNIC_DISTANCE_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.DISTANCE:
                const distance = message.readUInt16LE(4);
                this.notify("distance", { distance });
                break;
            case Mode.FAST_DISTANCE:
                const fastDistance = message.readUInt16LE(4);
                this.notify("fastDistance", { fastDistance });
                break;
        }
    }
    setBrightness(topLeft, bottomLeft, topRight, bottomRight) {
        this.writeDirect(0x05, Buffer.from([topLeft, topRight, bottomLeft, bottomRight]));
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["DISTANCE"] = 0] = "DISTANCE";
    Mode[Mode["FAST_DISTANCE"] = 1] = "FAST_DISTANCE";
})(Mode || (Mode = {}));
export const ModeMap = {
    "distance": Mode.DISTANCE,
    "fastDistance": Mode.FAST_DISTANCE
};
