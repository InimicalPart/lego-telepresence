import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class MarioPantsSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.MARIO_PANTS_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.PANTS:
                const pants = message[4];
                this.notify("pants", { pants });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["PANTS"] = 0] = "PANTS";
})(Mode || (Mode = {}));
export const ModeMap = {
    "pants": Mode.PANTS,
};
