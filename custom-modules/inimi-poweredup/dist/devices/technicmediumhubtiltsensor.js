import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class TechnicMediumHubTiltSensor extends Device {
    _impactThreshold = 10;
    _impactHoldoff = 10;
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.TECHNIC_MEDIUM_HUB_TILT_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.TILT:
                let z = -message.readInt16LE(4);
                const y = message.readInt16LE(6);
                const x = message.readInt16LE(8);
                if (y === 90 || y === -90) {
                    z = Math.sign(y) * (z + 180);
                    if (z > 180)
                        z -= 360;
                    if (z < -180)
                        z += 360;
                }
                this.notify("tilt", { x, y, z });
                break;
            case Mode.IMPACT_COUNT:
                if (message.length !== 8) {
                    break;
                }
                const count = message.readUInt32LE(4);
                this.notify("impactCount", { count });
                break;
        }
    }
    setImpactCount(count) {
        return new Promise((resolve) => {
            const payload = Buffer.alloc(4);
            payload.writeUInt32LE(count % 2 ** 32);
            this.writeDirect(0x01, payload);
            return resolve();
        });
    }
    setImpactThreshold(threshold) {
        this._impactThreshold = threshold;
        return new Promise((resolve) => {
            this.writeDirect(0x02, Buffer.from([this._impactThreshold, this._impactHoldoff]));
            return resolve();
        });
    }
    setImpactHoldoff(holdoff) {
        this._impactHoldoff = holdoff;
        return new Promise((resolve) => {
            this.writeDirect(0x02, Buffer.from([this._impactThreshold, this._impactHoldoff]));
            return resolve();
        });
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["TILT"] = 0] = "TILT";
    Mode[Mode["IMPACT_COUNT"] = 1] = "IMPACT_COUNT";
})(Mode || (Mode = {}));
export const ModeMap = {
    "tilt": Mode.TILT,
    "impactCount": Mode.IMPACT_COUNT
};
