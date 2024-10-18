import { Device } from "inimi-ble"
import compareVersion from "compare-versions";

import { LPF2Hub } from "./lpf2hub.js";

import * as Consts from "../consts.js";

import { BLEDevice } from "../inimi/BLEDevice.js";


import Debug = require("debug");
const debug = Debug("technicmediumhub");

/**
 * The TechnicMediumHub is emitted if the discovered device is a Technic Medium Hub.
 * @class TechnicMediumHub
 * @extends LPF2Hub
 * @extends BaseHub
 */
export class TechnicMediumHub extends LPF2Hub {


    public static async IsTechnicMediumHub (peripheral: Device) {
        return (
            (await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.TECHNIC_MEDIUM_HUB_ID
        );
    }

    constructor (device: BLEDevice) {
        super(device, PortMap, Consts.HubType.TECHNIC_MEDIUM_HUB);
        debug("Discovered Control+ Hub");
    }


    public async connect () {
        debug("Connecting to Control+ Hub");
        await super.connect();
        debug("Connect completed");
    }


}

export const PortMap: {[portName: string]: number} = {
    "A": 0,
    "B": 1,
    "C": 2,
    "D": 3,
    "HUB_LED": 50,
    "CURRENT_SENSOR": 59,
    "VOLTAGE_SENSOR": 60,
    "ACCELEROMETER": 97,
    "GYRO_SENSOR": 98,
    "TILT_SENSOR": 99
};
