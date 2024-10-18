import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class CurrentSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.CURRENT_SENSOR);
    }
    receive(message) {
        const mode = this.mode;
        switch (mode) {
            case Mode.CURRENT:
                if (this.isWeDo2SmartHub) {
                    const current = message.readInt16LE(2) / 1000;
                    this.notify("current", { current });
                }
                else {
                    let maxCurrentValue = MaxCurrentValue[this.hub.type];
                    if (maxCurrentValue === undefined) {
                        maxCurrentValue = MaxCurrentValue[Consts.HubType.UNKNOWN];
                    }
                    let maxCurrentRaw = MaxCurrentRaw[this.hub.type];
                    if (maxCurrentRaw === undefined) {
                        maxCurrentRaw = MaxCurrentRaw[Consts.HubType.UNKNOWN];
                    }
                    const current = message.readUInt16LE(4) * maxCurrentValue / maxCurrentRaw;
                    this.notify("current", { current });
                }
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["CURRENT"] = 0] = "CURRENT";
})(Mode || (Mode = {}));
export const ModeMap = {
    "current": Mode.CURRENT
};
const MaxCurrentValue = {
    [Consts.HubType.UNKNOWN]: 2444,
    [Consts.HubType.TECHNIC_MEDIUM_HUB]: 4175,
};
const MaxCurrentRaw = {
    [Consts.HubType.UNKNOWN]: 4095,
};
