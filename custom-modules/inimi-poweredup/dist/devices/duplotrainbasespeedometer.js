import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class DuploTrainBaseSpeedometer extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.DUPLO_TRAIN_BASE_SPEEDOMETER);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.SPEED:
                const speed = message.readInt16LE(4);
                this.notify("speed", { speed });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["SPEED"] = 0] = "SPEED";
})(Mode || (Mode = {}));
export const ModeMap = {
    "speed": Mode.SPEED
};
