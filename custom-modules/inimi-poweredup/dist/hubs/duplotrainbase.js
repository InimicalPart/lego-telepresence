import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
import { LPF2Hub } from "./lpf2hub.js";
import * as Consts from "../consts.js";
const Debug = __require("debug");
const debug = Debug("duplotrainbase");
export class DuploTrainBase extends LPF2Hub {
    static async IsDuploTrainBase(peripheral) {
        return ((await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.DUPLO_TRAIN_BASE_ID);
    }
    constructor(device) {
        super(device, PortMap, Consts.HubType.DUPLO_TRAIN_BASE);
        debug("Discovered Duplo Train Base");
    }
    async connect() {
        debug("Connecting to Duplo Train Base");
        await super.connect();
        debug("Connect completed");
    }
}
export const PortMap = {
    "MOTOR": 0,
    "COLOR": 18,
    "SPEEDOMETER": 19
};
