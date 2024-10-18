import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
const Debug = __require("debug");
import { EventEmitter } from "events";
const debug = Debug("bledevice");
export class WebBLEDevice extends EventEmitter {
    _webBLEServer;
    _uuid;
    _name = "";
    _listeners = {};
    _characteristics = {};
    _queue = Promise.resolve();
    _mailbox = [];
    _connected = false;
    _connecting = false;
    constructor(device) {
        super();
        this._webBLEServer = device;
        this._uuid = device.device.id;
        this._name = device.device.name;
        device.device.addEventListener("gattserverdisconnected", () => {
            this._connecting = false;
            this._connected = false;
            this.emit("disconnect");
        });
        setTimeout(() => {
            this.emit("discoverComplete");
        }, 2000);
    }
    get uuid() {
        return this._uuid;
    }
    get name() {
        return this._name;
    }
    get connecting() {
        return this._connecting;
    }
    get connected() {
        return this._connected;
    }
    connect() {
        return new Promise((resolve) => {
            this._connected = true;
            return resolve();
        });
    }
    disconnect() {
        return new Promise((resolve) => {
            this._webBLEServer.device.gatt.disconnect();
            this._connected = false;
            return resolve();
        });
    }
    async discoverCharacteristicsForService(uuid) {
        debug("Service/characteristic discovery started");
        const service = await this._webBLEServer.getPrimaryService(uuid);
        const characteristics = await service.getCharacteristics();
        for (const characteristic of characteristics) {
            this._characteristics[characteristic.uuid] = characteristic;
        }
        debug("Service/characteristic discovery finished");
    }
    subscribeToCharacteristic(uuid, callback) {
        if (this._listeners[uuid]) {
            this._characteristics[uuid].removeEventListener("characteristicvaluechanged", this._listeners[uuid]);
        }
        this._listeners[uuid] = (event) => {
            const buf = Buffer.alloc(event.target.value.buffer.byteLength);
            const view = new Uint8Array(event.target.value.buffer);
            for (let i = 0; i < buf.length; i++) {
                buf[i] = view[i];
            }
            debug("Incoming data", buf);
            return callback(buf);
        };
        this._characteristics[uuid].addEventListener("characteristicvaluechanged", this._listeners[uuid]);
        const mailbox = Array.from(this._mailbox);
        this._mailbox = [];
        for (const data of mailbox) {
            debug("Replayed from mailbox (LPF2_ALL)", data);
            callback(data);
        }
        return this._characteristics[uuid].startNotifications();
    }
    addToCharacteristicMailbox(uuid, data) {
        this._mailbox.push(data);
    }
    readFromCharacteristic(uuid, callback) {
        this._characteristics[uuid].readValue().then((data) => {
            const buf = Buffer.alloc(data.buffer.byteLength);
            const view = new Uint8Array(data.buffer);
            for (let i = 0; i < buf.length; i++) {
                buf[i] = view[i];
            }
            callback(null, buf);
        });
    }
    writeToCharacteristic(uuid, data) {
        return this._queue = this._queue.then(() => this._characteristics[uuid].writeValueWithoutResponse(data));
    }
    _sanitizeUUID(uuid) {
        return uuid.replace(/-/g, "");
    }
}
