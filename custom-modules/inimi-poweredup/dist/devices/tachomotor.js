import { BasicMotor } from "./basicmotor.js";
import * as Consts from "../consts.js";
import { mapSpeed } from "../utils.js";
export class TachoMotor extends BasicMotor {
    _brakeStyle = Consts.BrakingStyle.BRAKE;
    _maxPower = 100;
    useAccelerationProfile = true;
    useDecelerationProfile = true;
    constructor(hub, portId, modeMap = {}, type = Consts.DeviceType.UNKNOWN) {
        super(hub, portId, Object.assign({}, modeMap, ModeMap), type);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.ROTATION:
                const degrees = message.readInt32LE(this.isWeDo2SmartHub ? 2 : 4);
                this.notify("rotate", { degrees });
                break;
        }
    }
    setBrakingStyle(style) {
        this._brakeStyle = style;
    }
    setMaxPower(maxPower) {
        this._maxPower = maxPower;
    }
    setAccelerationTime(time, profile = 0x00) {
        const message = Buffer.from([0x81, this.portId, 0x11, 0x05, 0x00, 0x00, profile]);
        message.writeUInt16LE(time, 4);
        this.send(message);
    }
    setDecelerationTime(time, profile = 0x00) {
        const message = Buffer.from([0x81, this.portId, 0x11, 0x06, 0x00, 0x00, profile]);
        message.writeUInt16LE(time, 4);
        this.send(message);
    }
    setSpeed(speed, time) {
        if (!this.isVirtualPort && speed instanceof Array) {
            throw new Error("Only virtual ports can accept multiple speeds");
        }
        if (this.isWeDo2SmartHub) {
            throw new Error("Motor speed is not available on the WeDo 2.0 Smart Hub");
        }
        this.cancelEventTimer();
        return new Promise((resolve) => {
            if (speed === undefined || speed === null) {
                speed = 100;
            }
            let message;
            if (time !== undefined) {
                if (speed instanceof Array) {
                    message = Buffer.from([0x81, this.portId, 0x11, 0x0a, 0x00, 0x00, mapSpeed(speed[0]), mapSpeed(speed[1]), this._maxPower, this._brakeStyle, this.useProfile()]);
                }
                else {
                    message = Buffer.from([0x81, this.portId, 0x11, 0x09, 0x00, 0x00, mapSpeed(speed), this._maxPower, this._brakeStyle, this.useProfile()]);
                }
                message.writeUInt16LE(time, 4);
            }
            else {
                if (speed instanceof Array) {
                    message = Buffer.from([0x81, this.portId, 0x11, 0x08, mapSpeed(speed[0]), mapSpeed(speed[1]), this._maxPower, this.useProfile()]);
                }
                else {
                    message = Buffer.from([0x81, this.portId, 0x11, 0x07, mapSpeed(speed), this._maxPower, this.useProfile()]);
                }
            }
            this.send(message);
            this._finishedCallbacks.push(() => {
                return resolve();
            });
        });
    }
    rotateByDegrees(degrees, speed) {
        if (!this.isVirtualPort && speed instanceof Array) {
            throw new Error("Only virtual ports can accept multiple speeds");
        }
        if (this.isWeDo2SmartHub) {
            throw new Error("Rotation is not available on the WeDo 2.0 Smart Hub");
        }
        this.cancelEventTimer();
        return new Promise((resolve) => {
            if (speed === undefined || speed === null) {
                speed = 100;
            }
            let message;
            if (speed instanceof Array) {
                message = Buffer.from([0x81, this.portId, 0x11, 0x0c, 0x00, 0x00, 0x00, 0x00, mapSpeed(speed[0]), mapSpeed(speed[1]), this._maxPower, this._brakeStyle, this.useProfile()]);
            }
            else {
                message = Buffer.from([0x81, this.portId, 0x11, 0x0b, 0x00, 0x00, 0x00, 0x00, mapSpeed(speed), this._maxPower, this._brakeStyle, this.useProfile()]);
            }
            message.writeUInt32LE(degrees, 4);
            this.send(message);
            this._finishedCallbacks.push(() => {
                return resolve();
            });
        });
    }
    useProfile() {
        let value = 0x00;
        if (this.useAccelerationProfile) {
            value += 0x01;
        }
        if (this.useDecelerationProfile) {
            value += 0x02;
        }
        return value;
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["ROTATION"] = 2] = "ROTATION";
})(Mode || (Mode = {}));
export const ModeMap = {
    "rotate": Mode.ROTATION
};
