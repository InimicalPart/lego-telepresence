import EventEmitter from "node:events";
import { BaseHub } from "./hubs/basehub.js";
import { Adapter, createBluetooth, Device } from "inimi-ble";
import { BLEDevice, Consts, DuploTrainBase, Hub, Mario, MoveHub, RemoteControl, TechnicMediumHub, WeDo2SmartHub, TechnicSmallHub } from "./index.js";

let ready = false;
let wantScan = false;



const isMatchingPeripheral = async (peripheral: Device) => {
    const allowedServices = [
        Consts.BLEService.LPF2_HUB,
        Consts.BLEService.LPF2_HUB.replace(/-/g, ""),
        Consts.BLEService.WEDO2_SMART_HUB,
        Consts.BLEService.WEDO2_SMART_HUB.replace(/-/g, "")
    ]


    const uuids = await peripheral.getUUIDs()

    return uuids.some((uuid) => allowedServices.includes(uuid.toLowerCase()));
} 

const { bluetooth, destroy } = createBluetooth();
const adapter: Adapter = await bluetooth.defaultAdapter();

export class PoweredUP extends EventEmitter {
    private _connectedHubs: { [uuid: string]: BaseHub } = {};
    private discoverDetectionInterval: NodeJS.Timeout | undefined;

    private knownDevices: string[] = [];


    constructor() {
        super();
        this.discoverDetectionInterval = setInterval(async () => {
            if (!adapter.isDiscovering() || !wantScan) return this.knownDevices = [];
            const allDevices = await adapter.devices();
            const newDevices = allDevices.filter((device) => 
                !this.knownDevices.includes(device)
            );

            for (const device of newDevices) {
                const peripheral = await adapter.getDevice(device).catch((e)=>{});
                if (!peripheral) continue;
                if (await isMatchingPeripheral(peripheral)) {
                    this.onDiscover(peripheral);
                }
            }
            this.knownDevices = allDevices;
        }, 1000)
        process.on("beforeExit", (code)=>this.cleanup(code, false))
        process.on("SIGINT", (code)=>this.cleanup(code, false))
        process.on("SIGUSR1", (code)=>this.cleanup(code, false))
        process.on("SIGUSR2", (code)=>this.cleanup(code, false))
        process.on("uncaughtException", (code)=>this.cleanup(code, true))
        process.on("unhandledRejection", (code)=>this.cleanup(code, true))
        ready = true;
    }


    public async cleanup(code: any, log: boolean) {
        if (log) console.error(code)
        if (code == 99) return
        for (const hub of Object.values(this._connectedHubs ?? {})) {
            await hub.disconnect();
        }
        destroy();
        process.exit(99)
    }

    /**
     * Begin scanning for Powered UP Hub devices.
     * @method PoweredUP#scan
     */
    public async scan () {
        wantScan = true;

        if (ready) adapter.startDiscovery().catch((e)=>{});

        return true;
    }


    /**
     * Stop scanning for Powered UP Hub devices.
     * @method PoweredUP#stop
     */
    public stop () {
        wantScan = false;
        adapter.stopDiscovery().catch((e)=>{});
    }


    /**
     * Retrieve a list of Powered UP Hubs.
     * @method PoweredUP#getHubs
     * @returns {BaseHub[]}
     */
    public getHubs () {
        return Object.values(this._connectedHubs);
    }


    /**
     * Retrieve a Powered UP Hub by UUID.
     * @method PoweredUP#getHubByUUID
     * @param {string} uuid
     * @returns {BaseHub | null}
     */
    public getHubByUUID (uuid: string) {
        return this._connectedHubs[uuid];
    }


    /**
     * Retrieve a Powered UP Hub by primary MAC address.
     * @method PoweredUP#getHubByPrimaryMACAddress
     * @param {string} address
     * @returns {BaseHub}
     */
    public getHubByPrimaryMACAddress (address: string) {
        return Object.values(this._connectedHubs).filter((hub) => hub.primaryMACAddress === address)[0];
    }


    /**
     * Retrieve a list of Powered UP Hub by name.
     * @method PoweredUP#getHubsByName
     * @param {string} name
     * @returns {BaseHub[]}
     */
    public getHubsByName (name: string) {
        return Object.values(this._connectedHubs).filter((hub) => hub.name === name);
    }


    /**
     * Retrieve a list of Powered UP Hub by type.
     * @method PoweredUP#getHubsByType
     * @param {string} name
     * @returns {BaseHub[]}
     */
    public getHubsByType (hubType: number) {
        return Object.values(this._connectedHubs).filter((hub) => hub.type === hubType);
    }

    private async onDiscover(peripheral: Device) {
        let hub: BaseHub;

        const device = new BLEDevice(peripheral);

        if (await WeDo2SmartHub.IsWeDo2SmartHub(peripheral)) {
            hub = new WeDo2SmartHub(device);
        } else if (await MoveHub.IsMoveHub(peripheral)) {
            hub = new MoveHub(device);
        } else if (await Hub.IsHub(peripheral)) {
            hub = new Hub(device);
        } else if (await RemoteControl.IsRemoteControl(peripheral)) {
            hub = new RemoteControl(device);
        } else if (await DuploTrainBase.IsDuploTrainBase(peripheral)) {
            hub = new DuploTrainBase(device);
        } else if (await TechnicSmallHub.IsTechnicSmallHub(peripheral)) {
            hub = new TechnicSmallHub(device);
        } else if (await TechnicMediumHub.IsTechnicMediumHub(peripheral)) {
            hub = new TechnicMediumHub(device);
        } else if (await Mario.IsMario(peripheral)) {
            hub = new Mario(device);
        } else {
            return;
        }

        hub.on("connect", () => {
            this._connectedHubs[hub.uuid] = hub;
        });

        hub.on("disconnect", () => {
            delete this._connectedHubs[hub.uuid];
        });

        this.emit("discover", {
            hub: hub,
            peripheral: peripheral
        });
    }

    
}