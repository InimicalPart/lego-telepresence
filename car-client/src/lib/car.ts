import EventEmitter from "events";
import {PoweredUP, BaseHub, Hub, TechnicMediumAngularMotor } from "inimi-poweredup";
import { Device } from "inimi-ble";

const poweredUP = new PoweredUP();

export default class TechnicClient {
    public MAC: string;
    private debug: boolean = false;
    public events: EventEmitter = new EventEmitter();
    private logger = (...args: any[]) => (this.debug ? console.log : () => {})(...args)
    private hub: Hub
    private peripheral: Device
    public connected = false;
    private isConnectedChecker = setInterval(() => {
        if (this.hub && !this.hub.connected && this.connected) {
            this.events.emit("disconnect")
            this.connected = false
        }
    }, 250)
    
    constructor(MAC: string, debug: boolean = false) {
        this.MAC = MAC.toUpperCase()
        this.debug = debug
    }

    async connect(timeout=30000) {
        return new Promise((resolve, reject) => {

            let timeoutTimer = setTimeout(() => {
                poweredUP.stop();
                this.logger("Failed to find to Technic Hub with MAC", this.MAC)
                reject("UNABLE_TO_FIND")
            }, timeout)


            poweredUP.on("discover", async (data: {
                hub: Hub,
                peripheral: Device
            }) => {
                if ((await data.peripheral.getAddress()).toUpperCase() == this.MAC) {
                    clearTimeout(timeoutTimer)
                    poweredUP.stop();
                    this.logger(`Discovered ${data.hub.name}!`)
                    this.logger("Connecting to Technic Hub with MAC", this.MAC)
                    await data.hub.connect();
                    this.logger("Connected to Technic Hub with MAC", this.MAC)
                    this.connected = true
                    this.hub = data.hub
                    this.peripheral = data.peripheral
                    this.events.emit("ready")
                    resolve(null)
                }
            })

            
            this.logger("Searching for Technic Hub with MAC", this.MAC)
            poweredUP.scan();

        })
    }

    //! -- COMMANDS -- !\\

    async disconnect() {
        if (this.connected) {
            this.hub.disconnect()
        }
    }

    getBattery() {
        return this.hub.batteryLevel
    }

    async getInfo() {
        return {
            name: this.hub.name,
            batteryLevel: this.hub.batteryLevel,
            firmwareVersion: this.hub.firmwareVersion,
            hardwareVersion: this.hub.hardwareVersion,
            MACAddress: await this.peripheral.getAddress(),
        }
    }

    async getPorts() {
        return this.hub.ports
    }

    async getDevices() {
        return this.hub.getDevices()
    }

    async powerOff() {
        return this.hub.shutdown()
    }

    async getDeviceAtPort(port: string) {
        return this.hub.getDeviceAtPort(port)
    }

    async turnRight(front: TechnicMediumAngularMotor, back: TechnicMediumAngularMotor, back2: TechnicMediumAngularMotor) {
        back.setPower(-50)
        back2.setPower(-50)
        front.gotoAngle(90, 50)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        front.gotoAngle(-0, 50)
        back.setPower(50)
        back2.setPower(50)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        front.gotoAngle(0, 50)
        back.setPower(0)
        back2.setPower(0)


    }

    //! -- COMMANDS -- !\\



}