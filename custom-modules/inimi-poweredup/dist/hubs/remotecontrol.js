import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
import { LPF2Hub } from "./lpf2hub.js";
import * as Consts from "../consts.js";
const Debug = __require("debug");
const debug = Debug("remotecontrol");
export class RemoteControl extends LPF2Hub {
    static async IsRemoteControl(peripheral) {
        return ((await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.REMOTE_CONTROL_ID);
    }
    constructor(device) {
        super(device, PortMap, Consts.HubType.REMOTE_CONTROL);
        debug("Discovered Powered UP Remote");
    }
    async connect() {
        debug("Connecting to Powered UP Remote");
        await super.connect();
        debug("Connect completed");
    }
}
export const PortMap = {
    "LEFT": 0,
    "RIGHT": 1,
    "HUB_LED": 52,
    "VOLTAGE_SENSOR": 59,
    "REMOTE_CONTROL_RSSI": 60
};
