import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
import { LPF2Hub } from "./lpf2hub.js";
import * as Consts from "../consts.js";
const Debug = __require("debug");
const debug = Debug("hub");
export class TechnicSmallHub extends LPF2Hub {
    static async IsTechnicSmallHub(peripheral) {
        return ((await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.TECHNIC_SMALL_HUB_ID);
    }
    _currentPort = 0x3b;
    constructor(device) {
        super(device, PortMap, Consts.HubType.TECHNIC_SMALL_HUB);
        debug("Discovered Spike Essential Hub");
    }
    async connect() {
        debug("Connecting to Spike Essential Hub");
        await super.connect();
        debug("Connect completed");
    }
}
export const PortMap = {
    "A": 0,
    "B": 1,
    "HUB_LED": 49,
    "CURRENT_SENSOR": 59,
    "VOLTAGE_SENSOR": 60,
    "ACCELEROMETER": 97,
    "GYRO_SENSOR": 98,
    "TILT_SENSOR": 99
};
