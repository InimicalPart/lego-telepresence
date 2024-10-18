import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
import { compareVersions } from "compare-versions";
import { LPF2Hub } from "./lpf2hub.js";
import * as Consts from "../consts.js";
const Debug = __require("debug");
const debug = Debug("movehub");
export class MoveHub extends LPF2Hub {
    static async IsMoveHub(peripheral) {
        return ((await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.MOVE_HUB_ID);
    }
    constructor(device) {
        super(device, PortMap, Consts.HubType.MOVE_HUB);
        debug("Discovered Move Hub");
    }
    async connect() {
        debug("Connecting to Move Hub");
        await super.connect();
        debug("Connect completed");
    }
    _checkFirmware(version) {
        if (compareVersions("2.0.00.0017", version) === 1) {
            throw new Error(`Your Move Hub's (${this.name}) firmware is out of date and unsupported by this library. Please update it via the official Powered Up app.`);
        }
    }
}
export const PortMap = {
    "A": 0,
    "B": 1,
    "C": 2,
    "D": 3,
    "HUB_LED": 50,
    "TILT_SENSOR": 58,
    "CURRENT_SENSOR": 59,
    "VOLTAGE_SENSOR": 60
};
