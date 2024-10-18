import { Device } from "./device.js";
import * as Consts from "../consts.js";
import { calculateRamp } from "../utils.js";
export class Light extends Device {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.LIGHT);
    }
    setBrightness(brightness, interrupt = true) {
        if (interrupt) {
            this.cancelEventTimer();
        }
        return new Promise((resolve) => {
            this.writeDirect(0x00, Buffer.from([brightness]));
            return resolve();
        });
    }
    rampBrightness(fromBrightness, toBrightness, time) {
        this.cancelEventTimer();
        return new Promise((resolve) => {
            calculateRamp(this, fromBrightness, toBrightness, time)
                .on("changePower", (power) => {
                this.setBrightness(power, false);
            })
                .on("finished", resolve);
        });
    }
}
