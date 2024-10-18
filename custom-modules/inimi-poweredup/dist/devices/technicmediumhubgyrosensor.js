import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class TechnicMediumHubGyroSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.TECHNIC_MEDIUM_HUB_GYRO_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.GYRO:
                const x = Math.round(message.readInt16LE(4) * 7 / 400);
                const y = Math.round(message.readInt16LE(6) * 7 / 400);
                const z = Math.round(message.readInt16LE(8) * 7 / 400);
                this.notify("gyro", { x, y, z });
                break;
        }
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["GYRO"] = 0] = "GYRO";
})(Mode || (Mode = {}));
export const ModeMap = {
    "gyro": Mode.GYRO
};
