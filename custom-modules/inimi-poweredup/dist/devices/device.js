import { EventEmitter } from "events";
import * as Consts from "../consts.js";
export class Device extends EventEmitter {
    autoSubscribe = true;
    values = {};
    _mode;
    _busy = false;
    _finishedCallbacks = [];
    _hub;
    _portId;
    _connected = true;
    _type;
    _modeMap = {};
    _isWeDo2SmartHub;
    _isVirtualPort = false;
    _eventTimer = null;
    constructor(hub, portId, modeMap = {}, type = Consts.DeviceType.UNKNOWN) {
        super();
        this._hub = hub;
        this._portId = portId;
        this._type = type;
        this._modeMap = modeMap;
        this._isWeDo2SmartHub = (this.hub.type === Consts.HubType.WEDO2_SMART_HUB);
        this._isVirtualPort = this.hub.isPortVirtual(portId);
        const eventAttachListener = (event) => {
            if (event === "detach") {
                return;
            }
            if (this.autoSubscribe) {
                if (this._modeMap[event] !== undefined) {
                    this.subscribe(this._modeMap[event]);
                }
            }
        };
        const deviceDetachListener = (device) => {
            if (device.portId === this.portId) {
                this._connected = false;
                this.hub.removeListener("detach", deviceDetachListener);
                this.emit("detach");
            }
        };
        for (const event in this._modeMap) {
            if (this.hub.listenerCount(event) > 0) {
                eventAttachListener(event);
            }
        }
        this.hub.on("newListener", eventAttachListener);
        this.on("newListener", eventAttachListener);
        this.hub.on("detach", deviceDetachListener);
    }
    get connected() {
        return this._connected;
    }
    get hub() {
        return this._hub;
    }
    get portId() {
        return this._portId;
    }
    get portName() {
        return this.hub.getPortNameForPortId(this.portId);
    }
    get type() {
        return this._type;
    }
    get typeName() {
        return Consts.DeviceTypeNames[this.type];
    }
    get mode() {
        return this._mode;
    }
    get isWeDo2SmartHub() {
        return this._isWeDo2SmartHub;
    }
    get isVirtualPort() {
        return this._isVirtualPort;
    }
    writeDirect(mode, data) {
        if (this.isWeDo2SmartHub) {
            return this.send(Buffer.concat([Buffer.from([this.portId, 0x01, 0x02]), data]), Consts.BLECharacteristic.WEDO2_MOTOR_VALUE_WRITE);
        }
        else {
            return this.send(Buffer.concat([Buffer.from([0x81, this.portId, 0x11, 0x51, mode]), data]), Consts.BLECharacteristic.LPF2_ALL);
        }
    }
    send(data, characteristic = Consts.BLECharacteristic.LPF2_ALL) {
        this._ensureConnected();
        return this.hub.send(data, characteristic);
    }
    subscribe(mode) {
        this._ensureConnected();
        if (mode !== this._mode) {
            this._mode = mode;
            this.hub.subscribe(this.portId, this.type, mode);
        }
    }
    unsubscribe(mode) {
        this._ensureConnected();
    }
    receive(message) {
        this.notify("receive", { message });
    }
    notify(event, values) {
        this.values[event] = values;
        this.emit(event, values);
        if (this.hub.listenerCount(event) > 0) {
            this.hub.emit(event, this, values);
        }
    }
    requestUpdate() {
        this.send(Buffer.from([0x21, this.portId, 0x00]));
    }
    finish(message) {
        if ((message & 0x10) === 0x10)
            return;
        this._busy = (message & 0x01) === 0x01;
        while (this._finishedCallbacks.length > Number(this._busy)) {
            const callback = this._finishedCallbacks.shift();
            if (callback) {
                callback();
            }
        }
    }
    setEventTimer(timer) {
        this._eventTimer = timer;
    }
    cancelEventTimer() {
        if (this._eventTimer) {
            clearTimeout(this._eventTimer);
            this._eventTimer = null;
        }
    }
    _ensureConnected() {
        if (!this.connected) {
            throw new Error("Device is not connected");
        }
    }
}
