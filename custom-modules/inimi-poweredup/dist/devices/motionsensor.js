import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class MotionSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.MOTION_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.DISTANCE:
                let distance = message[this.isWeDo2SmartHub ? 2 : 4];
                if (message[this.isWeDo2SmartHub ? 3 : 5] === 1) {
                    distance = distance + 255;
                }
                distance *= 10;
                this.notify("distance", { distance });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["DISTANCE"] = 0] = "DISTANCE";
})(Mode || (Mode = {}));
export const ModeMap = {
    "distance": Mode.DISTANCE
};
