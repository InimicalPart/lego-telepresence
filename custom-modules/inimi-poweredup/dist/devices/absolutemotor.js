import { TachoMotor } from "./tachomotor.js";
import * as Consts from "../consts.js";
import { mapSpeed, normalizeAngle } from "../utils.js";
export class AbsoluteMotor extends TachoMotor {
    constructor(hub, portId, modeMap = {}, type = Consts.DeviceType.UNKNOWN) {
        super(hub, portId, Object.assign({}, modeMap, ModeMap), type);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.ABSOLUTE:
                const angle = normalizeAngle(message.readInt16LE(this.isWeDo2SmartHub ? 2 : 4));
                this.notify("absolute", { angle });
                break;
            default:
                super.receive(message);
                break;
        }
    }
    gotoAngle(angle, speed = 100) {
        if (!this.isVirtualPort && angle instanceof Array) {
            throw new Error("Only virtual ports can accept multiple positions");
        }
        if (this.isWeDo2SmartHub) {
            throw new Error("Absolute positioning is not available on the WeDo 2.0 Smart Hub");
        }
        this.cancelEventTimer();
        return new Promise((resolve) => {
            if (speed === undefined || speed === null) {
                speed = 100;
            }
            let message;
            if (angle instanceof Array) {
                message = Buffer.from([0x81, this.portId, 0x11, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, mapSpeed(speed), this._maxPower, this._brakeStyle, this.useProfile()]);
                message.writeInt32LE(normalizeAngle(angle[0]), 4);
                message.writeInt32LE(normalizeAngle(angle[1]), 8);
            }
            else {
                message = Buffer.from([0x81, this.portId, 0x11, 0x0d, 0x00, 0x00, 0x00, 0x00, mapSpeed(speed), this._maxPower, this._brakeStyle, this.useProfile()]);
                message.writeInt32LE(normalizeAngle(angle), 4);
            }
            this.send(message);
            this._finishedCallbacks.push(() => {
                return resolve();
            });
        });
    }
    gotoRealZero(speed = 100) {
        return new Promise((resolve) => {
            const oldMode = this.mode;
            let calibrated = false;
            this.on("absolute", async ({ angle }) => {
                if (!calibrated) {
                    calibrated = true;
                    if (angle < 0) {
                        angle = Math.abs(angle);
                    }
                    else {
                        speed = -speed;
                    }
                    await this.rotateByDegrees(angle, speed);
                    if (oldMode) {
                        this.subscribe(oldMode);
                    }
                    return resolve();
                }
            });
            this.requestUpdate();
        });
    }
    resetZero() {
        return new Promise((resolve) => {
            const data = Buffer.from([0x81, this.portId, 0x11, 0x51, 0x02, 0x00, 0x00, 0x00, 0x00]);
            this.send(data);
            return resolve();
        });
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["ROTATION"] = 2] = "ROTATION";
    Mode[Mode["ABSOLUTE"] = 3] = "ABSOLUTE";
})(Mode || (Mode = {}));
export const ModeMap = {
    "rotate": Mode.ROTATION,
    "absolute": Mode.ABSOLUTE
};
