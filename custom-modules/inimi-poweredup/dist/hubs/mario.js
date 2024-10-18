import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
import { LPF2Hub } from "./lpf2hub.js";
import * as Consts from "../consts.js";
const Debug = __require("debug");
const debug = Debug("movehub");
export class Mario extends LPF2Hub {
    static async IsMario(peripheral) {
        return ((await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.MARIO_ID);
    }
    constructor(device) {
        super(device, PortMap, Consts.HubType.MARIO);
        debug("Discovered Mario");
    }
    async connect() {
        debug("Connecting to Mario");
        await super.connect();
        debug("Connect completed");
    }
}
export const PortMap = {};
