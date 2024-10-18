import { Device } from "inimi-ble"
import { compareVersions } from "compare-versions";

import { IBLEAbstraction } from "../interfaces.js";

import { LPF2Hub } from "./lpf2hub.js";
import { BLEDevice } from "../inimi/BLEDevice.js";

import * as Consts from "../consts.js";

import Debug = require("debug");
const debug = Debug("movehub");


/**
 * The MoveHub is emitted if the discovered device is a Move Hub.
 * @class MoveHub
 * @extends LPF2Hub
 * @extends BaseHub
 */
export class MoveHub extends LPF2Hub {


    public static async IsMoveHub (peripheral: Device) {
        return (
            (await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.MOVE_HUB_ID
        );

        
    }

    constructor (device: BLEDevice) {
        super(device, PortMap, Consts.HubType.MOVE_HUB);
        debug("Discovered Move Hub");
    }


    public async connect () {
        debug("Connecting to Move Hub");
        await super.connect();
        debug("Connect completed");
    }


    protected _checkFirmware (version: string) {
        if (compareVersions("2.0.00.0017", version) === 1) {
            throw new Error(`Your Move Hub's (${this.name}) firmware is out of date and unsupported by this library. Please update it via the official Powered Up app.`);
        }
    }


}

export const PortMap: {[portName: string]: number} = {
    "A": 0,
    "B": 1,
    "C": 2,
    "D": 3,
    "HUB_LED": 50,
    "TILT_SENSOR": 58,
    "CURRENT_SENSOR": 59,
    "VOLTAGE_SENSOR": 60
};
