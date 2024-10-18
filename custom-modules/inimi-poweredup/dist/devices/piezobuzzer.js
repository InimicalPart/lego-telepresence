import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class PiezoBuzzer extends Device {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.PIEZO_BUZZER);
    }
    playTone(frequency, time) {
        return new Promise((resolve) => {
            const data = Buffer.from([0x05, 0x02, 0x04, 0x00, 0x00, 0x00, 0x00]);
            data.writeUInt16LE(frequency, 3);
            data.writeUInt16LE(time, 5);
            this.send(data, Consts.BLECharacteristic.WEDO2_MOTOR_VALUE_WRITE);
            global.setTimeout(resolve, time);
        });
    }
}
