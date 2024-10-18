import { Device } from "inimi-ble"

import { LPF2Hub } from "./lpf2hub.js";

import * as Consts from "../consts.js";

import Debug = require("debug");
import { IBLEAbstraction } from "../interfaces.js";
const debug = Debug("duplotrainbase");
import { BLEDevice } from "../inimi/BLEDevice.js";


/**
 * The DuploTrainBase is emitted if the discovered device is a Duplo Train Base.
 * @class DuploTrainBase
 * @extends LPF2Hub
 * @extends BaseHub
 */
export class DuploTrainBase extends LPF2Hub {


    public static async IsDuploTrainBase (peripheral: Device) {
        return (
            (await peripheral.getUUIDs()).indexOf(Consts.BLEService.LPF2_HUB) >= 0 &&
            !!Object.values((await peripheral.getManufacturerData()))[0] &&
            Object.values((await peripheral.getManufacturerData()))[0].length > 1 &&
            Object.values((await peripheral.getManufacturerData()))[0][1] === Consts.BLEManufacturerData.DUPLO_TRAIN_BASE_ID
        );
    }


    constructor (device: BLEDevice) {
        super(device, PortMap, Consts.HubType.DUPLO_TRAIN_BASE);
        debug("Discovered Duplo Train Base");
    }


    public async connect () {
        debug("Connecting to Duplo Train Base");
        await super.connect();
        debug("Connect completed");
    }


}

export const PortMap: {[portName: string]: number} = {
    "MOTOR": 0,
    "COLOR": 18,
    "SPEEDOMETER": 19
};

