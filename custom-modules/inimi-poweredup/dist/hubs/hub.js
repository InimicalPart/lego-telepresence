import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
import { compareVersions } from "compare-versions";
import { LPF2Hub } from "./lpf2hub.js";
import * as Consts from "../consts.js";
const Debug = __require("debug");
const debug = Debug("hub");
export class Hub extends LPF2Hub {
    static async IsHub(peripheral) {
        return ((await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.HUB_ID);
    }
    _currentPort = 0x3b;
    constructor(device) {
        super(device, PortMap, Consts.HubType.HUB);
        debug("Discovered Powered UP Hub");
    }
    async connect() {
        debug("Connecting to Powered UP Hub");
        await super.connect();
        debug("Connect completed");
    }
    _checkFirmware(version) {
        if (compareVersions("1.1.00.0004", version) === 1) {
            throw new Error(`Your Powered Up Hub's (${this.name}) firmware is out of date and unsupported by this library. Please update it via the official Powered Up app.`);
        }
    }
}
export const PortMap = {
    "A": 0,
    "B": 1,
    "HUB_LED": 50,
    "CURRENT_SENSOR": 59,
    "VOLTAGE_SENSOR": 60
};
