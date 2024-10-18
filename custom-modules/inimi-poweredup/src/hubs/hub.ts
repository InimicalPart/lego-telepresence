import { Device } from "inimi-ble";
import { compareVersions } from "compare-versions";

import { IBLEAbstraction } from "../interfaces.js";

import { LPF2Hub } from "./lpf2hub.js";

import * as Consts from "../consts.js";
import { BLEDevice } from "../inimi/BLEDevice.js";

import Debug = require("debug");
const debug = Debug("hub");


/**
 * The Hub is emitted if the discovered device is a Hub.
 * @class Hub
 * @extends LPF2Hub
 * @extends BaseHub
 */
export class Hub extends LPF2Hub {


    public static async IsHub (peripheral: Device) {

        return (
            (await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.HUB_ID
        );
    }

    protected _currentPort = 0x3b;

    constructor (device: BLEDevice) {
        super(device, PortMap, Consts.HubType.HUB);
        debug("Discovered Powered UP Hub");
    }


    public async connect () {
        debug("Connecting to Powered UP Hub");
        await super.connect();
        debug("Connect completed");
    }


    protected _checkFirmware (version: string) {
        if (compareVersions("1.1.00.0004", version) === 1) {
            throw new Error(`Your Powered Up Hub's (${this.name}) firmware is out of date and unsupported by this library. Please update it via the official Powered Up app.`);
        }
    }


}

export const PortMap: {[portName: string]: number} = {
    "A": 0,
    "B": 1,
    "HUB_LED": 50,
    "CURRENT_SENSOR": 59,
    "VOLTAGE_SENSOR": 60
};
