import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class VoltageSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.VOLTAGE_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.VOLTAGE:
                if (this.isWeDo2SmartHub) {
                    const voltage = message.readInt16LE(2) / 40;
                    this.notify("voltage", { voltage });
                }
                else {
                    let maxVoltageValue = MaxVoltageValue[this.hub.type];
                    if (maxVoltageValue === undefined) {
                        maxVoltageValue = MaxVoltageValue[Consts.HubType.UNKNOWN];
                    }
                    let maxVoltageRaw = MaxVoltageRaw[this.hub.type];
                    if (maxVoltageRaw === undefined) {
                        maxVoltageRaw = MaxVoltageRaw[Consts.HubType.UNKNOWN];
                    }
                    const voltage = message.readUInt16LE(4) * maxVoltageValue / maxVoltageRaw;
                    this.notify("voltage", { voltage });
                }
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["VOLTAGE"] = 0] = "VOLTAGE";
})(Mode || (Mode = {}));
export const ModeMap = {
    "voltage": Mode.VOLTAGE
};
const MaxVoltageValue = {
    [Consts.HubType.UNKNOWN]: 9.615,
    [Consts.HubType.DUPLO_TRAIN_BASE]: 6.4,
    [Consts.HubType.REMOTE_CONTROL]: 6.4,
};
const MaxVoltageRaw = {
    [Consts.HubType.UNKNOWN]: 3893,
    [Consts.HubType.DUPLO_TRAIN_BASE]: 3047,
    [Consts.HubType.REMOTE_CONTROL]: 3200,
    [Consts.HubType.TECHNIC_MEDIUM_HUB]: 4095,
};
