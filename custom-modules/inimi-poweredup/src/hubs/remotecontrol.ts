import { Device } from "inimi-ble";

import { IBLEAbstraction } from "../interfaces.js";

import { LPF2Hub } from "./lpf2hub.js";

import * as Consts from "../consts.js";

import Debug = require("debug");
const debug = Debug("remotecontrol");

import { BLEDevice } from "../inimi/BLEDevice.js";

/**
 * The RemoteControl is emitted if the discovered device is a Remote Control.
 * @class RemoteControl
 * @extends LPF2Hub
 * @extends BaseHub
 */
export class RemoteControl extends LPF2Hub {


    public static async IsRemoteControl (peripheral: Device) {
        return (
            (await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.REMOTE_CONTROL_ID
        );
        
    }


    constructor (device: BLEDevice) {
        super(device, PortMap, Consts.HubType.REMOTE_CONTROL);
        debug("Discovered Powered UP Remote");
    }


    public async connect () {
        debug("Connecting to Powered UP Remote");
        await super.connect();
        debug("Connect completed");
    }


}

export const PortMap: {[portName: string]: number} = {
    "LEFT": 0,
    "RIGHT": 1,
    "HUB_LED": 52,
    "VOLTAGE_SENSOR": 59,
    "REMOTE_CONTROL_RSSI": 60
};
