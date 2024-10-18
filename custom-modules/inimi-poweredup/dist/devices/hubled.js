import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class HubLED extends Device {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.HUB_LED);
    }
    setColor(color) {
        return new Promise((resolve) => {
            if (typeof color === "boolean") {
                color = 0;
            }
            if (this.isWeDo2SmartHub) {
                this.send(Buffer.from([0x06, 0x17, 0x01, 0x01]), Consts.BLECharacteristic.WEDO2_PORT_TYPE_WRITE);
                this.send(Buffer.from([0x06, 0x04, 0x01, color]), Consts.BLECharacteristic.WEDO2_MOTOR_VALUE_WRITE);
            }
            else {
                this.subscribe(Mode.COLOR);
                this.writeDirect(0x00, Buffer.from([color]));
            }
            return resolve();
        });
    }
    setRGB(red, green, blue) {
        return new Promise((resolve) => {
            if (this.isWeDo2SmartHub) {
                this.send(Buffer.from([0x06, 0x17, 0x01, 0x02]), Consts.BLECharacteristic.WEDO2_PORT_TYPE_WRITE);
                this.send(Buffer.from([0x06, 0x04, 0x03, red, green, blue]), Consts.BLECharacteristic.WEDO2_MOTOR_VALUE_WRITE);
            }
            else {
                this.subscribe(Mode.RGB);
                this.writeDirect(0x01, Buffer.from([red, green, blue]));
            }
            return resolve();
        });
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["COLOR"] = 0] = "COLOR";
    Mode[Mode["RGB"] = 1] = "RGB";
})(Mode || (Mode = {}));
