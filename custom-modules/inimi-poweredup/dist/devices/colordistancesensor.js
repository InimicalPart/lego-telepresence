import { Device } from "./device.js";
import * as Consts from "../consts.js";
import { parseColor } from "../utils.js";
export class ColorDistanceSensor extends Device {
    constructor(hub, portId) {
        super(hub, portId, ModeMap, Consts.DeviceType.COLOR_DISTANCE_SENSOR);
    }
    receive(message) {
        const mode = this._mode;
        switch (mode) {
            case Mode.COLOR:
                if (message[this.isWeDo2SmartHub ? 2 : 4] <= 10) {
                    const color = parseColor(message[this.isWeDo2SmartHub ? 2 : 4]);
                    this.notify("color", { color });
                }
                break;
            case Mode.DISTANCE:
                if (this.isWeDo2SmartHub) {
                    break;
                }
                if (message[4] <= 10) {
                    let distance = Math.floor(message[4] * 25.4) - 20;
                    if (distance < 0) {
                        distance = 0;
                    }
                    this.notify("distance", { distance });
                }
                break;
            case Mode.DISTANCE_COUNT:
                if (this.isWeDo2SmartHub) {
                    break;
                }
                if (message.length !== 8) {
                    break;
                }
                const count = message.readUInt32LE(4);
                this.notify("distanceCount", { count });
                break;
            case Mode.REFLECT:
                if (this.isWeDo2SmartHub) {
                    break;
                }
                const reflect = message[4];
                this.notify("reflect", { reflect });
                break;
            case Mode.AMBIENT:
                if (this.isWeDo2SmartHub) {
                    break;
                }
                const ambient = message[4];
                this.notify("ambient", { ambient });
                break;
            case Mode.RGB_I:
                if (this.isWeDo2SmartHub) {
                    break;
                }
                if (message.length !== 10) {
                    break;
                }
                const red = message.readUInt16LE(4);
                const green = message.readUInt16LE(6);
                const blue = message.readUInt16LE(8);
                this.notify("rgbIntensity", { red, green, blue });
                break;
            case Mode.COLOR_AND_DISTANCE:
                if (this.isWeDo2SmartHub) {
                    break;
                }
                let distance = message[5];
                const partial = message[7];
                if (partial > 0) {
                    distance += 1.0 / partial;
                }
                distance = Math.floor(distance * 25.4) - 20;
                if (message[4] <= 10) {
                    const color = message[4];
                    this.notify("colorAndDistance", { color, distance });
                }
                break;
        }
    }
    setPFExtendedChannel(channel) {
        let address = 0;
        if (channel >= 4) {
            channel -= 4;
            address = 1;
        }
        const message = Buffer.alloc(2);
        message[0] = ((channel - 1) << 4) + (address << 3);
        message[1] = 6 << 4;
        return this.sendPFIRMessage(message);
    }
    setPFPower(channel, output, power) {
        let address = 0;
        if (channel > 4) {
            channel -= 4;
            address = 1;
        }
        const message = Buffer.alloc(2);
        message[0] = ((channel - 1) << 4) + (address << 3) + (output === "RED" ? 4 : 5);
        message[1] = this._pfPowerToPWM(power) << 4;
        return this.sendPFIRMessage(message);
    }
    startPFMotors(channel, powerBlue, powerRed) {
        let address = 0;
        if (channel > 4) {
            channel -= 4;
            address = 1;
        }
        const message = Buffer.alloc(2);
        message[0] = (((channel - 1) + 4 + (address << 3)) << 4) + this._pfPowerToPWM(powerBlue);
        message[1] = this._pfPowerToPWM(powerRed) << 4;
        return this.sendPFIRMessage(message);
    }
    sendPFIRMessage(message) {
        if (this.isWeDo2SmartHub) {
            throw new Error("Power Functions IR is not available on the WeDo 2.0 Smart Hub");
        }
        else {
            const payload = Buffer.alloc(2);
            payload[0] = (message[0] << 4) + (message[1] >> 4);
            payload[1] = message[0] >> 4;
            this.subscribe(Mode.PF_IR);
            return this.writeDirect(0x07, payload);
        }
    }
    setColor(color) {
        return new Promise((resolve) => {
            if (color === false) {
                color = 0;
            }
            if (this.isWeDo2SmartHub) {
                throw new Error("Setting LED color is not available on the WeDo 2.0 Smart Hub");
            }
            else {
                this.subscribe(Mode.LED);
                this.writeDirect(0x05, Buffer.from([color]));
            }
            return resolve();
        });
    }
    setDistanceCount(count) {
        return new Promise((resolve) => {
            if (this.isWeDo2SmartHub) {
                throw new Error("Setting distance count is not available on the WeDo 2.0 Smart Hub");
            }
            else {
                const payload = Buffer.alloc(4);
                payload.writeUInt32LE(count % 2 ** 32);
                this.writeDirect(0x02, payload);
            }
            return resolve();
        });
    }
    _pfPowerToPWM(power) {
        return power & 15;
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["COLOR"] = 0] = "COLOR";
    Mode[Mode["DISTANCE"] = 1] = "DISTANCE";
    Mode[Mode["DISTANCE_COUNT"] = 2] = "DISTANCE_COUNT";
    Mode[Mode["REFLECT"] = 3] = "REFLECT";
    Mode[Mode["AMBIENT"] = 4] = "AMBIENT";
    Mode[Mode["LED"] = 5] = "LED";
    Mode[Mode["RGB_I"] = 6] = "RGB_I";
    Mode[Mode["PF_IR"] = 7] = "PF_IR";
    Mode[Mode["COLOR_AND_DISTANCE"] = 8] = "COLOR_AND_DISTANCE";
})(Mode || (Mode = {}));
export const ModeMap = {
    "color": Mode.COLOR,
    "distance": Mode.DISTANCE,
    "distanceCount": Mode.DISTANCE_COUNT,
    "reflect": Mode.REFLECT,
    "ambient": Mode.AMBIENT,
    "rgbIntensity": Mode.RGB_I,
    "colorAndDistance": Mode.COLOR_AND_DISTANCE
};
export var Output;
(function (Output) {
    Output["RED"] = "RED";
    Output["BLUE"] = "BLUE";
})(Output || (Output = {}));
