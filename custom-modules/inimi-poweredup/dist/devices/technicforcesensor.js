import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class TechnicForceSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.TECHNIC_FORCE_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.FORCE:
                const force = message[this.isWeDo2SmartHub ? 2 : 4] / 10;
                this.notify("force", { force });
                break;
            case Mode.TOUCHED:
                const touched = message[4] ? true : false;
                this.notify("touched", { touched });
                break;
            case Mode.TAPPED:
                const tapped = message[4];
                this.notify("tapped", { tapped });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["FORCE"] = 0] = "FORCE";
    Mode[Mode["TOUCHED"] = 1] = "TOUCHED";
    Mode[Mode["TAPPED"] = 2] = "TAPPED";
})(Mode || (Mode = {}));
export const ModeMap = {
    "force": Mode.FORCE,
    "touched": Mode.TOUCHED,
    "tapped": Mode.TAPPED
};
