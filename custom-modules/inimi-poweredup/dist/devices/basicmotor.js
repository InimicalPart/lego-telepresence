import { Device } from "./device.js";
import * as Consts from "../consts.js";
import { calculateRamp, mapSpeed } from "../utils.js";
export class BasicMotor extends Device {
    constructor(hub, portId, modeMap, type = Consts.DeviceType.UNKNOWN) {
        super(hub, portId, modeMap, type);
    }
    setPower(power, interrupt = true) {
        if (interrupt) {
            this.cancelEventTimer();
        }
        return this.writeDirect(0x00, Buffer.from([mapSpeed(power)]));
    }
    rampPower(fromPower, toPower, time) {
        this.cancelEventTimer();
        return new Promise((resolve) => {
            calculateRamp(this, fromPower, toPower, time)
                .on("changePower", (power) => {
                this.setPower(power, false);
            })
                .on("finished", resolve);
        });
    }
    stop() {
        this.cancelEventTimer();
        return this.setPower(0);
    }
    brake() {
        this.cancelEventTimer();
        return this.setPower(Consts.BrakingStyle.BRAKE);
    }
}
