export class BLEDevice {
    mac;
    name;
    connecting;
    connected;
    _mailbox = [];
    _characteristics = {};
    device;
    constructor(device) {
        this.device = device;
        device.getAddress().then((address) => this.mac = address);
        device.getName().then((name) => this.name = name);
        this.connecting = false;
        this.connected = false;
        device.on("connect", () => {
            this.connecting = false;
            this.connected = true;
        });
        device.on("disconnect", () => {
            this.connecting = false;
            this.connected = false;
        });
    }
    async connect() {
        this.connecting = true;
        await this.device.connect();
    }
    async disconnect() {
        await this.device.disconnect();
    }
    async discoverCharacteristicsForService(uuid) {
        try {
            const gatt = await this.device.gatt();
            const service = await gatt.getPrimaryService(uuid);
            const characteristics = await service.characteristics();
            for (const characteristicUUID of characteristics) {
                let characteristic = await service.getCharacteristic(characteristicUUID);
                this._characteristics[characteristicUUID] = characteristic;
            }
        }
        catch (error) {
            console.error('discoverCharacteristicsForService error:', error);
            return;
        }
    }
    ;
    subscribeToCharacteristic(uuid, callback) {
        this._characteristics[uuid].startNotifications();
        this._characteristics[uuid].on("valuechanged", (data) => {
            return callback(data);
        });
    }
    addToCharacteristicMailbox(uuid, data) {
        this._mailbox.push(data);
    }
    readFromCharacteristic(uuid, callback) {
        this._characteristics[uuid].readValue().then((data) => {
            return callback(null, data);
        }).catch((error) => {
            return callback(error, null);
        });
    }
    writeToCharacteristic(uuid, data) {
        return new Promise((resolve, reject) => {
            this._characteristics[uuid].writeValueWithResponse(data).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }
}
