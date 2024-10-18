import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
import { EventEmitter } from "events";
import { ColorDistanceSensor } from "../devices/colordistancesensor.js";
import { CurrentSensor } from "../devices/currentsensor.js";
import { Device } from "../devices/device.js";
import { DuploTrainBaseColorSensor } from "../devices/duplotrainbasecolorsensor.js";
import { DuploTrainBaseMotor } from "../devices/duplotrainbasemotor.js";
import { DuploTrainBaseSpeaker } from "../devices/duplotrainbasespeaker.js";
import { DuploTrainBaseSpeedometer } from "../devices/duplotrainbasespeedometer.js";
import { HubLED } from "../devices/hubled.js";
import { Light } from "../devices/light.js";
import { MarioAccelerometer } from "../devices/marioaccelerometer.js";
import { MarioBarcodeSensor } from "../devices/mariobarcodesensor.js";
import { MarioPantsSensor } from "../devices/mariopantssensor.js";
import { MediumLinearMotor } from "../devices/mediumlinearmotor.js";
import { MotionSensor } from "../devices/motionsensor.js";
import { MoveHubMediumLinearMotor } from "../devices/movehubmediumlinearmotor.js";
import { MoveHubTiltSensor } from "../devices/movehubtiltsensor.js";
import { PiezoBuzzer } from "../devices/piezobuzzer.js";
import { RemoteControlButton } from "../devices/remotecontrolbutton.js";
import { SimpleMediumLinearMotor } from "../devices/simplemediumlinearmotor.js";
import { TechnicColorSensor } from "../devices/techniccolorsensor.js";
import { TechnicDistanceSensor } from "../devices/technicdistancesensor.js";
import { TechnicForceSensor } from "../devices/technicforcesensor.js";
import { TechnicLargeAngularMotor } from "../devices/techniclargeangularmotor.js";
import { TechnicLargeLinearMotor } from "../devices/techniclargelinearmotor.js";
import { TechnicSmallAngularMotor } from "../devices/technicsmallangularmotor.js";
import { TechnicMediumAngularMotor } from "../devices/technicmediumangularmotor.js";
import { TechnicMediumHubAccelerometerSensor } from "../devices/technicmediumhubaccelerometersensor.js";
import { TechnicMediumHubGyroSensor } from "../devices/technicmediumhubgyrosensor.js";
import { TechnicMediumHubTiltSensor } from "../devices/technicmediumhubtiltsensor.js";
import { TechnicXLargeLinearMotor } from "../devices/technicxlargelinearmotor.js";
import { TiltSensor } from "../devices/tiltsensor.js";
import { TrainMotor } from "../devices/trainmotor.js";
import { VoltageSensor } from "../devices/voltagesensor.js";
import * as Consts from "../consts.js";
const Debug = __require("debug");
import { Technic3x3ColorLightMatrix } from "../devices/technic3x3colorlightmatrix.js";
const debug = Debug("basehub");
export class BaseHub extends EventEmitter {
    _attachedDevices = {};
    _name = "";
    _firmwareVersion = "0.0.00.0000";
    _hardwareVersion = "0.0.00.0000";
    _primaryMACAddress = "00:00:00:00:00:00";
    _batteryLevel = 100;
    _rssi = -60;
    _portMap = {};
    _virtualPorts = [];
    _bleDevice;
    _type;
    _attachCallbacks = [];
    constructor(bleDevice, portMap = {}, type = Consts.HubType.UNKNOWN) {
        super();
        this.setMaxListeners(23);
        this._type = type;
        this._bleDevice = bleDevice;
        this._portMap = Object.assign({}, portMap);
        bleDevice.device.on("disconnect", () => {
            this.emit("disconnect");
        });
    }
    get name() {
        return this._bleDevice.name;
    }
    get connected() {
        return this._bleDevice.connected;
    }
    get connecting() {
        return this._bleDevice.connecting;
    }
    get type() {
        return this._type;
    }
    get ports() {
        return Object.keys(this._portMap);
    }
    get firmwareVersion() {
        return this._firmwareVersion;
    }
    get hardwareVersion() {
        return this._hardwareVersion;
    }
    get primaryMACAddress() {
        return this._primaryMACAddress;
    }
    get uuid() {
        return this._bleDevice.mac;
    }
    get batteryLevel() {
        return this._batteryLevel;
    }
    get rssi() {
        return this._rssi;
    }
    connect() {
        if (this._bleDevice.connecting) {
            throw new Error("Already connecting");
        }
        else if (this._bleDevice.connected) {
            throw new Error("Already connected");
        }
        return this._bleDevice.connect();
    }
    disconnect() {
        return this._bleDevice.disconnect();
    }
    getDeviceAtPort(portName) {
        const portId = this._portMap[portName];
        if (portId !== undefined) {
            return this._attachedDevices[portId];
        }
        else {
            return undefined;
        }
    }
    waitForDeviceAtPort(portName) {
        return new Promise((resolve) => {
            const existingDevice = this.getDeviceAtPort(portName);
            if (existingDevice) {
                return resolve(existingDevice);
            }
            this._attachCallbacks.push((device) => {
                if (device.portName === portName) {
                    resolve(device);
                    return true;
                }
                else {
                    return false;
                }
            });
        });
    }
    getDevices() {
        return Object.values(this._attachedDevices);
    }
    getDevicesByType(deviceType) {
        return this.getDevices().filter((device) => device.type === deviceType);
    }
    waitForDeviceByType(deviceType) {
        return new Promise((resolve) => {
            const existingDevices = this.getDevicesByType(deviceType);
            if (existingDevices.length >= 1) {
                return resolve(existingDevices[0]);
            }
            this._attachCallbacks.push((device) => {
                if (device.type === deviceType) {
                    resolve(device);
                    return true;
                }
                else {
                    return false;
                }
            });
        });
    }
    getPortNameForPortId(portId) {
        for (const port of Object.keys(this._portMap)) {
            if (this._portMap[port] === portId) {
                return port;
            }
        }
        return;
    }
    isPortVirtual(portId) {
        return (this._virtualPorts.indexOf(portId) > -1);
    }
    sleep(delay) {
        return new Promise((resolve) => {
            global.setTimeout(resolve, delay);
        });
    }
    wait(commands) {
        return Promise.all(commands);
    }
    send(message, uuid) {
        return Promise.resolve();
    }
    subscribe(portId, deviceType, mode) {
    }
    unsubscribe(portId, deviceType, mode) {
    }
    manuallyAttachDevice(deviceType, portId) {
        if (!this._attachedDevices[portId]) {
            debug(`No device attached to portId ${portId}, creating and attaching device type ${deviceType}`);
            const device = this._createDevice(deviceType, portId);
            this._attachDevice(device);
            return device;
        }
        else {
            if (this._attachedDevices[portId].type === deviceType) {
                debug(`Device of ${deviceType} already attached to portId ${portId}, returning existing device`);
                return this._attachedDevices[portId];
            }
            else {
                throw new Error(`Already a different type of device attached to portId ${portId}. Only use this method when you are certain what's attached.`);
            }
        }
    }
    _attachDevice(device) {
        if (this._attachedDevices[device.portId] && this._attachedDevices[device.portId].type === device.type) {
            return;
        }
        this._attachedDevices[device.portId] = device;
        this.emit("attach", device);
        debug(`Attached device type ${device.type} (${Consts.DeviceTypeNames[device.type]}) on port ${device.portName} (${device.portId})`);
        let i = this._attachCallbacks.length;
        while (i--) {
            const callback = this._attachCallbacks[i];
            if (callback(device)) {
                this._attachCallbacks.splice(i, 1);
            }
        }
    }
    _detachDevice(device) {
        delete this._attachedDevices[device.portId];
        this.emit("detach", device);
        debug(`Detached device type ${device.type} (${Consts.DeviceTypeNames[device.type]}) on port ${device.portName} (${device.portId})`);
    }
    _createDevice(deviceType, portId) {
        let constructor;
        const deviceConstructors = {
            [Consts.DeviceType.LIGHT]: Light,
            [Consts.DeviceType.TRAIN_MOTOR]: TrainMotor,
            [Consts.DeviceType.SIMPLE_MEDIUM_LINEAR_MOTOR]: SimpleMediumLinearMotor,
            [Consts.DeviceType.MOVE_HUB_MEDIUM_LINEAR_MOTOR]: MoveHubMediumLinearMotor,
            [Consts.DeviceType.MOTION_SENSOR]: MotionSensor,
            [Consts.DeviceType.TILT_SENSOR]: TiltSensor,
            [Consts.DeviceType.MOVE_HUB_TILT_SENSOR]: MoveHubTiltSensor,
            [Consts.DeviceType.PIEZO_BUZZER]: PiezoBuzzer,
            [Consts.DeviceType.TECHNIC_COLOR_SENSOR]: TechnicColorSensor,
            [Consts.DeviceType.TECHNIC_DISTANCE_SENSOR]: TechnicDistanceSensor,
            [Consts.DeviceType.TECHNIC_FORCE_SENSOR]: TechnicForceSensor,
            [Consts.DeviceType.TECHNIC_MEDIUM_HUB_TILT_SENSOR]: TechnicMediumHubTiltSensor,
            [Consts.DeviceType.TECHNIC_MEDIUM_HUB_GYRO_SENSOR]: TechnicMediumHubGyroSensor,
            [Consts.DeviceType.TECHNIC_MEDIUM_HUB_ACCELEROMETER]: TechnicMediumHubAccelerometerSensor,
            [Consts.DeviceType.MEDIUM_LINEAR_MOTOR]: MediumLinearMotor,
            [Consts.DeviceType.TECHNIC_SMALL_ANGULAR_MOTOR]: TechnicSmallAngularMotor,
            [Consts.DeviceType.TECHNIC_MEDIUM_ANGULAR_MOTOR]: TechnicMediumAngularMotor,
            [Consts.DeviceType.TECHNIC_LARGE_ANGULAR_MOTOR]: TechnicLargeAngularMotor,
            [Consts.DeviceType.TECHNIC_LARGE_LINEAR_MOTOR]: TechnicLargeLinearMotor,
            [Consts.DeviceType.TECHNIC_XLARGE_LINEAR_MOTOR]: TechnicXLargeLinearMotor,
            [Consts.DeviceType.COLOR_DISTANCE_SENSOR]: ColorDistanceSensor,
            [Consts.DeviceType.VOLTAGE_SENSOR]: VoltageSensor,
            [Consts.DeviceType.CURRENT_SENSOR]: CurrentSensor,
            [Consts.DeviceType.REMOTE_CONTROL_BUTTON]: RemoteControlButton,
            [Consts.DeviceType.HUB_LED]: HubLED,
            [Consts.DeviceType.DUPLO_TRAIN_BASE_COLOR_SENSOR]: DuploTrainBaseColorSensor,
            [Consts.DeviceType.DUPLO_TRAIN_BASE_MOTOR]: DuploTrainBaseMotor,
            [Consts.DeviceType.DUPLO_TRAIN_BASE_SPEAKER]: DuploTrainBaseSpeaker,
            [Consts.DeviceType.DUPLO_TRAIN_BASE_SPEEDOMETER]: DuploTrainBaseSpeedometer,
            [Consts.DeviceType.MARIO_ACCELEROMETER]: MarioAccelerometer,
            [Consts.DeviceType.MARIO_BARCODE_SENSOR]: MarioBarcodeSensor,
            [Consts.DeviceType.MARIO_PANTS_SENSOR]: MarioPantsSensor,
            [Consts.DeviceType.TECHNIC_MEDIUM_ANGULAR_MOTOR_GREY]: TechnicMediumAngularMotor,
            [Consts.DeviceType.TECHNIC_LARGE_ANGULAR_MOTOR_GREY]: TechnicLargeAngularMotor,
            [Consts.DeviceType.TECHNIC_3X3_COLOR_LIGHT_MATRIX]: Technic3x3ColorLightMatrix,
        };
        constructor = deviceConstructors[deviceType];
        if (constructor) {
            return new constructor(this, portId, undefined, deviceType);
        }
        else {
            return new Device(this, portId, undefined, deviceType);
        }
    }
    _getDeviceByPortId(portId) {
        return this._attachedDevices[portId];
    }
}
