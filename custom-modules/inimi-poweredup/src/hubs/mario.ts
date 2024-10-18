import { Device } from "inimi-ble"
import compareVersion from "compare-versions";

import { BLEDevice } from "../inimi/BLEDevice.js";


import { LPF2Hub } from "./lpf2hub.js";

import * as Consts from "../consts.js";

import Debug = require("debug");
const debug = Debug("movehub");


/**
 * Mario is emitted if the discovered device is a LEGO Super Mario brick.
 * @class Mario
 * @extends LPF2Hub
 * @extends BaseHub
 */
export class Mario extends LPF2Hub {


    public static async IsMario (peripheral: Device) {
        return (
            (await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.MARIO_ID
        );

    }

    constructor (device: BLEDevice) {
        super(device, PortMap, Consts.HubType.MARIO);
        debug("Discovered Mario");
    }


    public async connect () {
        debug("Connecting to Mario");
        await super.connect();
        debug("Connect completed");
    }


}

export const PortMap: {[portName: string]: number} = {
};
