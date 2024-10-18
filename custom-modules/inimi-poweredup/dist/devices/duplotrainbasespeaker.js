import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class DuploTrainBaseSpeaker extends Device {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.DUPLO_TRAIN_BASE_SPEAKER);
    }
    playSound(sound) {
        return new Promise((resolve) => {
            this.subscribe(Mode.SOUND);
            this.writeDirect(0x01, Buffer.from([sound]));
            return resolve();
        });
    }
    playTone(tone) {
        this.subscribe(Mode.TONE);
        this.writeDirect(0x02, Buffer.from([tone]));
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["SOUND"] = 1] = "SOUND";
    Mode[Mode["TONE"] = 2] = "TONE";
})(Mode || (Mode = {}));
