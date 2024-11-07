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

    private deviceFound: boolean = false;

    private turnMotor: TechnicMediumAngularMotor;
    private frontMotor: TechnicMediumAngularMotor;
    private backMotor: TechnicMediumAngularMotor;

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
                if ((await data.peripheral.getAddress()).toUpperCase() == this.MAC && !this.deviceFound) {
                    this.deviceFound = true;
                    poweredUP.removeAllListeners("discover")
                    clearTimeout(timeoutTimer)
                    poweredUP.stop();
                    this.logger(`Discovered ${data.hub.name}!`)
                    this.logger("Connecting to Technic Hub with MAC", this.MAC)
                    try {
                        await sleep(1000) // Sleep for 1 second to allow the hub to be ready
                        await data.hub.connect();
                    } catch (e) {
                        console.warn(e.toString())
                        this.logger("Failed to connect to Technic Hub with MAC (is it paired?)", this.MAC)
                        this.deviceFound = false;
                        reject("UNABLE_TO_CONNECT")
                        return
                    }
                    this.logger("Connected to Technic Hub with MAC", this.MAC)
                    this.connected = true
                    this.hub = data.hub
                    this.peripheral = data.peripheral
                    this.events.emit("ready")

                    this.turnMotor = await this.hub.waitForDeviceAtPort("D") as TechnicMediumAngularMotor
                    this.frontMotor = await this.hub.waitForDeviceAtPort("A") as TechnicMediumAngularMotor
                    this.backMotor = await this.hub.waitForDeviceAtPort("B") as TechnicMediumAngularMotor

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

    async setWheelAngle(angle: number) {
        // Motor D - Wheel Turn
        // Motor A - Front Drive
        // Motor B - Back Drive

        console.log("Setting wheel angle to", angle)

        return await this.turnMotor.gotoAngle(angle, 100)
    }

    async realMove(type: "move"|"stop", data: {
        x: number | null,
        y: number | null,
        distance: number | null
    }) {


        if (type === "stop") {
            console.log("Stopping")
            await this.frontMotor.setPower(0,true)
            await this.backMotor.setPower(0,true)
            await this.turnMotor.gotoAngle(0, 100)
        } else if (type === "move") {

            console.log("------")
            console.log("Setting power to", data.y*100)
            console.log("Setting angle to", data.x*100)
            console.log("------")

            await this.turnMotor.gotoAngle(data.x*100, 100)
            await this.frontMotor.setPower(data.y*100, true)
            await this.backMotor.setPower(data.y*100, true)
        }
        return
    }

    async move(amount: number) {
        // Motor D - Wheel Turn
        // Motor A - Front Drive
        // Motor B - Back Drive

        console.log("Setting power to", amount)

        await this.frontMotor.setPower(amount),
        await this.backMotor.setPower(amount)
        return
    }

    //! -- COMMANDS -- !\\



}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}