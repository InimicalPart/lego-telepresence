import { Device, GattCharacteristic } from 'inimi-ble';

export class BLEDevice {
    mac: string;
    name: string;
    connecting: boolean;
    connected: boolean;
    private _mailbox: Buffer[] = [];


    private _characteristics: {[uuid: string]: GattCharacteristic} = {};
    

    public device: Device


    constructor(device: Device) {
        this.device = device;
        device.getAddress().then((address) => this.mac = address);
        device.getName().then((name) => this.name = name);
        this.connecting = false;
        this.connected = false;


        device.on("connect", () => {
            this.connecting = false;
            this.connected = true;
        })

        device.on("disconnect", () => {
            this.connecting = false;
            this.connected = false;
        })
    }


    async connect() {
        this.connecting = true;
        await this.device.connect();
    }

    async disconnect() {
        await this.device.disconnect();
    }

    async discoverCharacteristicsForService(uuid: string) {
        try {
            const gatt = await this.device.gatt()
            const service = await gatt.getPrimaryService(uuid)
            const characteristics = await service.characteristics()

            for (const characteristicUUID of characteristics) {
                let characteristic = await service.getCharacteristic(characteristicUUID)
                this._characteristics[characteristicUUID] = characteristic
            }            
        } catch (error) {
            console.error('discoverCharacteristicsForService error:', error)
            return
        }
    };

    public subscribeToCharacteristic (uuid: string, callback: (data: Buffer) => void) {
        this._characteristics[uuid].startNotifications();

        this._characteristics[uuid].on("valuechanged", (data: Buffer) => {
            return callback(data);
        });
    }


    public addToCharacteristicMailbox (uuid: string, data: Buffer) {
        this._mailbox.push(data);
    }


    public readFromCharacteristic (uuid: string, callback: (err: string | null, data: Buffer | null) => void) {
        this._characteristics[uuid].readValue().then((data) => {
            return callback(null, data);
        }).catch((error) => {
            return callback(error, null);
        })
    }


    public writeToCharacteristic (uuid: string, data: Buffer) {
        return new Promise<void>((resolve, reject) => {
            this._characteristics[uuid].writeValueWithResponse(data).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    }









}