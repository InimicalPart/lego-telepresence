import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
import { BaseHub } from "./basehub.js";
import * as Consts from "../consts.js";
import { isWebBluetooth } from "../utils.js";
const Debug = __require("debug");
const debug = Debug("wedo2smarthub");
export class WeDo2SmartHub extends BaseHub {
    static async IsWeDo2SmartHub(peripheral) {
        return ((await peripheral.getUUIDs()).indexOf(Consts.BLEService.WEDO2_SMART_HUB) >= 0);
    }
    _lastTiltX = 0;
    _lastTiltY = 0;
    constructor(device) {
        super(device, PortMap, Consts.HubType.WEDO2_SMART_HUB);
        debug("Discovered WeDo 2.0 Smart Hub");
    }
    connect() {
        return new Promise(async (resolve) => {
            debug("Connecting to WeDo 2.0 Smart Hub");
            await super.connect();
            await this._bleDevice.discoverCharacteristicsForService(Consts.BLEService.WEDO2_SMART_HUB);
            await this._bleDevice.discoverCharacteristicsForService(Consts.BLEService.WEDO2_SMART_HUB_2);
            if (!isWebBluetooth) {
                await this._bleDevice.discoverCharacteristicsForService(Consts.BLEService.WEDO2_SMART_HUB_3);
                await this._bleDevice.discoverCharacteristicsForService(Consts.BLEService.WEDO2_SMART_HUB_4);
                await this._bleDevice.discoverCharacteristicsForService(Consts.BLEService.WEDO2_SMART_HUB_5);
            }
            else {
                await this._bleDevice.discoverCharacteristicsForService("battery_service");
                await this._bleDevice.discoverCharacteristicsForService("device_information");
            }
            debug("Connect completed");
            this.emit("connect");
            resolve();
            this._bleDevice.subscribeToCharacteristic(Consts.BLECharacteristic.WEDO2_PORT_TYPE, this._parsePortMessage.bind(this));
            this._bleDevice.subscribeToCharacteristic(Consts.BLECharacteristic.WEDO2_SENSOR_VALUE, this._parseSensorMessage.bind(this));
            this._bleDevice.subscribeToCharacteristic(Consts.BLECharacteristic.WEDO2_BUTTON, this._parseSensorMessage.bind(this));
            if (!isWebBluetooth) {
                this._bleDevice.subscribeToCharacteristic(Consts.BLECharacteristic.WEDO2_BATTERY, this._parseBatteryMessage.bind(this));
                this._bleDevice.readFromCharacteristic(Consts.BLECharacteristic.WEDO2_BATTERY, (err, data) => {
                    if (data) {
                        this._parseBatteryMessage(data);
                    }
                });
            }
            else {
                this._bleDevice.readFromCharacteristic("00002a19-0000-1000-8000-00805f9b34fb", (err, data) => {
                    if (data) {
                        this._parseBatteryMessage(data);
                    }
                });
                this._bleDevice.subscribeToCharacteristic("00002a19-0000-1000-8000-00805f9b34fb", this._parseHighCurrentAlert.bind(this));
            }
            this._bleDevice.subscribeToCharacteristic(Consts.BLECharacteristic.WEDO2_HIGH_CURRENT_ALERT, this._parseHighCurrentAlert.bind(this));
            if (!isWebBluetooth) {
                this._bleDevice.readFromCharacteristic(Consts.BLECharacteristic.WEDO2_FIRMWARE_REVISION, (err, data) => {
                    if (data) {
                        this._parseFirmwareRevisionString(data);
                    }
                });
            }
            else {
                this._bleDevice.readFromCharacteristic("00002a26-0000-1000-8000-00805f9b34fb", (err, data) => {
                    if (data) {
                        this._parseFirmwareRevisionString(data);
                    }
                });
            }
        });
    }
    shutdown() {
        return this.send(Buffer.from([0x00]), Consts.BLECharacteristic.WEDO2_DISCONNECT);
    }
    setName(name) {
        if (name.length > 14) {
            throw new Error("Name must be 14 characters or less");
        }
        return new Promise((resolve) => {
            const data = Buffer.from(name, "ascii");
            this.send(data, Consts.BLECharacteristic.WEDO2_NAME_ID);
            this.send(data, Consts.BLECharacteristic.WEDO2_NAME_ID);
            this._name = name;
            return resolve();
        });
    }
    send(message, uuid) {
        if (debug.enabled) {
            debug(`Sent Message (${this._getCharacteristicNameFromUUID(uuid)})`, message);
        }
        return this._bleDevice.writeToCharacteristic(uuid, message);
    }
    subscribe(portId, deviceType, mode) {
        this.send(Buffer.from([0x01, 0x02, portId, deviceType, mode, 0x01, 0x00, 0x00, 0x00, 0x00, 0x01]), Consts.BLECharacteristic.WEDO2_PORT_TYPE_WRITE);
    }
    unsubscribe(portId, deviceType, mode) {
        this.send(Buffer.from([0x01, 0x02, portId, deviceType, mode, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]), Consts.BLECharacteristic.WEDO2_PORT_TYPE_WRITE);
    }
    _getCharacteristicNameFromUUID(uuid) {
        const keys = Object.keys(Consts.BLECharacteristic);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (Consts.BLECharacteristic[key] === uuid) {
                return key;
            }
        }
        return "UNKNOWN";
    }
    _parseHighCurrentAlert(data) {
        debug("Received Message (WEDO2_HIGH_CURRENT_ALERT)", data);
    }
    _parseBatteryMessage(data) {
        debug("Received Message (WEDO2_BATTERY)", data);
        const batteryLevel = data[0];
        if (batteryLevel !== this._batteryLevel) {
            this._batteryLevel = batteryLevel;
            this.emit("batteryLevel", { batteryLevel });
        }
    }
    _parseFirmwareRevisionString(data) {
        debug("Received Message (WEDO2_FIRMWARE_REVISION)", data);
        this._firmwareVersion = data.toString();
    }
    _parsePortMessage(data) {
        debug("Received Message (WEDO2_PORT_TYPE)", data);
        const portId = data[0];
        const event = data[1];
        const deviceType = event ? data[3] : 0;
        if (event === 0x01) {
            const device = this._createDevice(deviceType, portId);
            this._attachDevice(device);
        }
        else if (event === 0x00) {
            const device = this._getDeviceByPortId(portId);
            if (device) {
                this._detachDevice(device);
            }
        }
    }
    _parseSensorMessage(message) {
        debug("Received Message (WEDO2_SENSOR_VALUE)", message);
        if (message[0] === 0x01) {
            this.emit("button", { event: Consts.ButtonState.PRESSED });
            return;
        }
        else if (message[0] === 0x00) {
            this.emit("button", { event: Consts.ButtonState.RELEASED });
            return;
        }
        const portId = message[1];
        const device = this._getDeviceByPortId(portId);
        if (device) {
            device.receive(message);
        }
    }
}
export const PortMap = {
    "A": 1,
    "B": 2,
    "CURRENT_SENSOR": 3,
    "VOLTAGE_SENSOR": 4,
    "PIEZO_BUZZER": 5,
    "HUB_LED": 6
};
