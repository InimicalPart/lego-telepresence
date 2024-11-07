import EventEmitter from 'events'
import { Device, GattCharacteristic, GattServer, GattService } from 'node-ble'
import protobuf from 'protobufjs'

const {createBluetooth} = await import('node-ble')
const {bluetooth, destroy} = createBluetooth()
const adapter = await bluetooth.defaultAdapter()

const featureIds = ["02","F1","F5"]
const actionIds = ["02","03","04","05","0B","0C","82","83","84","85","64","65","66","67","69","6B","79","E4","E5","E6","E7","E9","EB","F9","6D","6E","6F","72","74","ED","EE","EF","F2","F3","F4","F5"]

const protomap = {
    "0202": {"type": "Request", "file": "network_management.proto", "name": "RequestStartScan"},
    "0203": {"type": "Request", "file": "network_management.proto", "name": "RequestGetApEntries"},
    "0204": {"type": "Request", "file": "network_management.proto", "name": "RequestConnect"},
    "0205": {"type": "Request", "file": "network_management.proto", "name": "RequestConnectNew"},
    "020B": {"type": "Notification", "file": "network_management.proto", "name": "NotifStartScanning"},
    "020C": {"type": "Notification", "file": "network_management.proto", "name": "NotifProvisioningState"},
    "0282": {"type": "Response", "file": "network_management.proto", "name": "ResponseStartScanning"},
    "0283": {"type": "Response", "file": "network_management.proto", "name": "ResponseGetApEntries"},
    "0284": {"type": "Response", "file": "network_management.proto", "name": "ResponseConnect"},
    "0285": {"type": "Response", "file": "network_management.proto", "name": "ResponseConnectNew"},
    "F164": {"type": "Request", "file": "preset_status.proto", "name": "RequestCustomPresetUpdate"},
    "F165": {"type": "Request", "file": "cohn.proto", "name": "RequestSetCOHNSetting"},
    "F166": {"type": "Request", "file": "cohn.proto", "name": "RequestClearCOHNCert"},
    "F167": {"type": "Request", "file": "cohn.proto", "name": "RequestCreateCOHNCert"},
    "F169": {"type": "Request", "file": "set_camera_control_status.proto", "name": "RequestSetCameraControlStatus"},
    "F16B": {"type": "Request", "file": "turbo_transfer.proto", "name": "RequestSetTurboActive"},
    "F179": {"type": "Request", "file": "live_streaming.proto", "name": "RequestSetLiveStreamMode"},
    "F1E4": {"type": "Response", "file": "response_generic.proto", "name": "ResponseGeneric"},
    "F1E5": {"type": "Response", "file": "response_generic.proto", "name": "ResponseGeneric"},
    "F1E6": {"type": "Response", "file": "response_generic.proto", "name": "ResponseGeneric"},
    "F1E7": {"type": "Response", "file": "response_generic.proto", "name": "ResponseGeneric"},
    "F1E9": {"type": "Response", "file": "response_generic.proto", "name": "ResponseGeneric"},
    "F1EB": {"type": "Response", "file": "response_generic.proto", "name": "ResponseGeneric"},
    "F1F9": {"type": "Response", "file": "response_generic.proto", "name": "ResponseGeneric"},
    "F56D": {"type": "Request", "file": "media.proto", "name": "RequestGetLastCapturedMedia"},
    "F56E": {"type": "Request", "file": "cohn.proto", "name": "RequestCOHNCert"},
    "F56F": {"type": "Request", "file": "cohn.proto", "name": "RequestGetCOHNStatus"},
    "F572": {"type": "Request", "file": "request_get_preset_status.proto", "name": "RequestGetPresetStatus"},
    "F574": {"type": "Request", "file": "live_streaming.proto", "name": "RequestGetLiveStreamStatus"},
    "F5ED": {"type": "Response", "file": "media.proto", "name": "ResponseLastCapturedMedia"},
    "F5EE": {"type": "Response", "file": "cohn.proto", "name": "ResponseCOHNCert"},
    "F5EF": {"type": "Response", "file": "cohn.proto", "name": "NotifyCOHNStatus"},
    "F5F2": {"type": "Response", "file": "preset_status.proto", "name": "NotifyPresetStatus"},
    "F5F3": {"type": "Notification", "file": "preset_status.proto", "name": "NotifyPresetStatus"},
    "F5F4": {"type": "Response", "file": "live_streaming.proto", "name": "NotifyLiveStreamStatus"},
    "F5F5": {"type": "Notification", "file": "live_streaming.proto", "name": "NotifyLiveStreamStatus"}
}

export default class GoProClient {
    public MAC: string
    private debug: boolean = false
    private isSetup: boolean = false
    public isSleeping: boolean = false
    public isConnected: boolean = false
    private device: Device;
    private keepAlive = false;
    public events: EventEmitter = new EventEmitter();
    private gatt: GattServer;
    private logger = (...args: any[]) => (this.debug ? console.log : () => {})(...args)
    
    private services: {
        FEA6: GattService
        INFO: GattService
        BATTERY: GattService
        GP0090: GattService
        GP0001: GattService
    } = {} as any

    private characteristics: {
        request: {
            COMMAND: GattCharacteristic
            SETTINGS: GattCharacteristic
            QUERY: GattCharacteristic
            NETWORK_MANAGEMENT: GattCharacteristic
        },
        response: {
            COMMAND_RESP: GattCharacteristic
            SETTINGS_RESP: GattCharacteristic
            QUERY_RESP: GattCharacteristic
            NETWORK_MANAGEMENT_RESP: GattCharacteristic
        },
    } = {
        request: {} as any,
        response: {} as any
    }    


    private cutOffMap: {
        [key: string]: {
            reportedLength: number,
            completeString: string,
            lastCounter: number,
            type: number
        }
    } = {}

    private protoWaitForList: {
        featureId: string,
        actionId: string,
        resolve: (message: any) => void,
        reject: (error: Error) => void
    }[] = []
    private tlvWaitForList: {
        commandId: string,
        resolve: (message: any) => void,
        reject: (error: Error) => void
    }[] = []

    private keepAliveTimer: NodeJS.Timeout;

    constructor(MAC: string, debug: boolean = false) {
        this.MAC = MAC
        this.debug = debug
    }

    async connect(retry: boolean = true) {
        if (this.device) {
            if (this.isConnected) this.device.disconnect()
            this.device.removeAllListeners()
        }
        this.logger("Searching for GoPro with MAC", this.MAC)
        await adapter.startDiscovery().catch((e)=>{})
        const device = await adapter.waitDevice(this.MAC, 120000, 1000)
        if (!device) {
            if (!retry) {
                this.logger("Failed to find GoPro")
                return
            }
            this.logger("Failed to find GoPro, retrying in 30 seconds...")
            setTimeout(()=>this.attemptReconnect(), 30000)
            return
        }
        this.logger("Found GoPro, connecting...")
        await adapter.stopDiscovery().catch((e)=>{})
        try {
            await device.connect()
        } catch (e) {
            if (!retry) {
                this.logger("Failed to connect to GoPro (might not be paired)")
                return
            }
            this.logger("Failed to connect to GoPro (might not be paired), retrying in 30 seconds...")
            setTimeout(()=>this.attemptReconnect(), 30000)
            return
        }

        this.isSleeping = false
        this.isConnected = true
        this.logger("Connected to GoPro")
        this.events.emit("connect")

        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer)
        }


        device.removeAllListeners("disconnect")

        device.on("disconnect", () => this.onDisconnect())

        if (!device.isPaired()) {
            this.logger("GoPro is not paired, pairing... (make sure you go into the GoPro's settings, and attempt to connect the GoPro Quik app)")
            while (!device.isPaired()) {
                await device.pair()
                if (!device.isPaired()) {
                    if (!retry) {
                        this.logger("Failed to pair")
                        return
                    }
                    this.logger("Failed to pair, retrying...")
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            }
            this.events.emit("pair")
            this.logger("Paired with GoPro")
        } else {
            this.logger("GoPro is already paired")
        }

        this.device = device

        await this.setup()
    }
    
    private async onDisconnect() {
        this.events.emit("disconnect", {isSleeping: this.isSleeping})
        this.isSetup = false
        this.keepAlive = false
        this.isConnected = false

        if (!this.isSleeping) {
            this.logger("GoPro disconnected, attempting to reconnect in 30 seconds...")
            setTimeout(()=>this.attemptReconnect(), 30000)
        } else {
            this.logger("GoPro disconnected because the user put it to sleep")
        }
        await this.stopListen()
    }

    private async attemptReconnect(retry?: boolean) {
        try {
            await this.connect(retry)
            return true
        } catch (error) {
            return false
        }
    }

    private async setup() {
        if (this.isSetup) {
            this.logger("Setup cancelled: Device is already setup")
            return
        }

        this.logger("Setting up services and characteristics...")
        this.gatt = await this.device.gatt()

        this.services.FEA6 = await this.gatt.getPrimaryService('0000fea6-0000-1000-8000-00805f9b34fb')
        this.services.INFO = await this.gatt.getPrimaryService('0000180a-0000-1000-8000-00805f9b34fb')
        this.services.BATTERY = await this.gatt.getPrimaryService('0000180f-0000-1000-8000-00805f9b34fb')
        this.services.GP0090 = await this.gatt.getPrimaryService('b5f90090-aa8d-11e3-9046-0002a5d5c51b')
        this.services.GP0001 = await this.gatt.getPrimaryService('b5f90001-aa8d-11e3-9046-0002a5d5c51b')


        this.characteristics.request.COMMAND = await this.services.FEA6.getCharacteristic('b5f90072-aa8d-11e3-9046-0002a5d5c51b')
        this.characteristics.response.COMMAND_RESP = await this.services.FEA6.getCharacteristic('b5f90073-aa8d-11e3-9046-0002a5d5c51b')
        this.characteristics.request.SETTINGS = await this.services.FEA6.getCharacteristic('b5f90074-aa8d-11e3-9046-0002a5d5c51b')
        this.characteristics.response.SETTINGS_RESP = await this.services.FEA6.getCharacteristic('b5f90075-aa8d-11e3-9046-0002a5d5c51b')
        this.characteristics.request.QUERY = await this.services.FEA6.getCharacteristic('b5f90076-aa8d-11e3-9046-0002a5d5c51b')
        this.characteristics.response.QUERY_RESP = await this.services.FEA6.getCharacteristic('b5f90077-aa8d-11e3-9046-0002a5d5c51b')
        this.characteristics.request.NETWORK_MANAGEMENT = await this.services.GP0090.getCharacteristic('b5f90091-aa8d-11e3-9046-0002a5d5c51b')
        this.characteristics.response.NETWORK_MANAGEMENT_RESP = await this.services.GP0090.getCharacteristic('b5f90092-aa8d-11e3-9046-0002a5d5c51b')


        this.isSetup = true
        await this.startListening();

        this.logger("Setup complete")
        this.events.emit("ready")
    }

    private async stopListen() {
        await this.characteristics.response.COMMAND_RESP.stopNotifications().catch(()=>{})
        await this.characteristics.response.SETTINGS_RESP.stopNotifications().catch(()=>{})
        await this.characteristics.response.QUERY_RESP.stopNotifications().catch(()=>{})
        await this.characteristics.response.NETWORK_MANAGEMENT_RESP.stopNotifications().catch(()=>{})
        
        this.characteristics.response.COMMAND_RESP.removeAllListeners('valuechanged')
        this.characteristics.response.SETTINGS_RESP.removeAllListeners('valuechanged')
        this.characteristics.response.QUERY_RESP.removeAllListeners('valuechanged')
        this.characteristics.response.NETWORK_MANAGEMENT_RESP.removeAllListeners('valuechanged')

    }

    private async startListening() {

        await this.characteristics.response.COMMAND_RESP.startNotifications()
        await this.characteristics.response.SETTINGS_RESP.startNotifications()
        await this.characteristics.response.QUERY_RESP.startNotifications()
        await this.characteristics.response.NETWORK_MANAGEMENT_RESP.startNotifications()

        this.characteristics.response.COMMAND_RESP.on('valuechanged', (b)=>this.parseReponse("COMMAND", b))
        this.characteristics.response.SETTINGS_RESP.on('valuechanged', (b)=>this.parseReponse("SETTINGS", b))
        this.characteristics.response.QUERY_RESP.on('valuechanged', (b)=>this.parseReponse("QUERY", b))
        this.characteristics.response.NETWORK_MANAGEMENT_RESP.on('valuechanged', (b)=>this.parseReponse("NETWORK_MANAGEMENT", b))
        this.logger("Listening for responses")
    }

    private async parseReponse(origin: "COMMAND" | "QUERY" | "NETWORK_MANAGEMENT" | "SETTINGS", buffer: Buffer) {
        const firstByte = buffer.toString("hex").substring(0, 2)
        const bin = this.hex2bin(firstByte)
        //! Check if incoming message is a continuation packet from a previous message (first bit is 1)
        if (bin[0] == "1") {
            const counter = parseInt(bin.substring(1), 2)
    
            Object.values(this.cutOffMap).every((a: {
                reportedLength: number,
                completeString: string,
                lastCounter: number,
                type: number
            }) => {
                const cutOffMapKey = Object.keys(this.cutOffMap).find((key) => this.cutOffMap[key] == a)

                if (a.lastCounter == counter - 1) {
                    a.lastCounter = counter
                    a.completeString += buffer.toString("hex").substring(2)
                    this.logger("Continuation packet found (length: " + (a.completeString.length/2) + " / " + a.reportedLength + ")")
                    if (a.completeString.length/2 == a.reportedLength) {
                        this.logger("Complete message found")
                        delete this.cutOffMap[cutOffMapKey]
                        this.parseReponse(origin, Buffer.concat([Buffer.from("00","hex"), Buffer.from(a.completeString, 'hex')]))
                    }
                    return false
                }
                return true
            })
            return
        }
    
        //! Check if incoming message is a cut off message (length doesn't match reported length)
        for (const key in protomap) {
            //! Don't check for cut off messages if the incoming message is the result of a cut off message
            if (buffer.toString("hex").substring(0, 2) == "00") {
                break
            }
            let allowedPositions = [2, 4, 6]
            if (buffer.toString("hex").toLowerCase().includes(key.toLowerCase())) {
                if (allowedPositions.includes(buffer.toString("hex").indexOf(key.toLowerCase()))) {
                    const firstByte = buffer.toString("hex").substring(0, 2)
                    const binarized = this.hex2bin(firstByte)
    
                    let length = 0;
                    let type = 0;
    
                    if (binarized[1] == "0" && binarized[2] == "0") {
                        // 5-bit length
                        length = parseInt(binarized.substring(3), 2)
                        type = 5
                    } else if (binarized[1] == "0" && binarized[2] == "1") {
                        // 13-bit length
                        const firstTwoBytes = buffer.toString("hex").substring(0, 4)
                        const binarized = this.hex2bin(firstTwoBytes)
    
                        length = parseInt(binarized.substring(3), 2)
                        type = 13
                    } else if (binarized[1] == "1") {
                        // 16-bit length
                        const lengthBytes = buffer.toString("hex").substring(2, 6)
                        const binarized = this.hex2bin(lengthBytes)
    
                        length = parseInt(binarized, 2)
                        type = 16
                    }                
    
                    if (length != buffer.length - 1) {
                        if (!this.cutOffMap[key]) {
                            this.logger("Received cut off message, waiting for continuation")
                            this.cutOffMap[key] = {"reportedLength": length, "completeString": buffer.toString("hex").substring(buffer.toString("hex").indexOf(key.toLowerCase())), lastCounter: -1, type }
                            return;       
                        }
                    }
                }
            }
        }
    
        const bufferString = buffer.toString("hex").substring(2)
        const FEATURE_ID = bufferString.substring(0, 2).toUpperCase() ?? "--"
        const ACTION_ID = bufferString.substring(2, 4).toUpperCase() ?? "--"
        const SERIALIZED = bufferString.substring(4)
    
        const COMMAND_ID = bufferString.substring(0, 2)
        const COMMAND_STATUS = bufferString.substring(2, 4)
        const PAYLOAD = bufferString.substring(4)
    
    
        let messageType: "proto" | "tlv" = null
    
        if (featureIds.includes(FEATURE_ID) && actionIds.includes(ACTION_ID)) {
            messageType = "proto"
        } else {
            messageType = "tlv"
        }
    
    
        if (messageType == "proto") {
            const messageTypeSpec = protomap[FEATURE_ID.toUpperCase() + ACTION_ID.toUpperCase()]
            if (messageTypeSpec) {
                const typeSpec = protobuf.loadSync("protos/" + messageTypeSpec.file)
                const messageType = typeSpec.lookupType("open_gopro." + messageTypeSpec.name)
    
                const message = messageType.decode(Buffer.from(SERIALIZED, 'hex')).toJSON()
                this.logger(`[PROTO] [${FEATURE_ID.toUpperCase() + ACTION_ID.toUpperCase()} - ${messageTypeSpec.name}]:`, message)
    
                const protoWaitFor = this.protoWaitForList.find((a) => a.featureId == FEATURE_ID && a.actionId == ACTION_ID)
                if (protoWaitFor) {
                    protoWaitFor.resolve(message)
                    this.protoWaitForList.splice(this.protoWaitForList.indexOf(protoWaitFor), 1)
                }
            }
        } else {
            if (origin == "QUERY") {
                console.log(buffer.toString("hex"))

                const QUERY_ID = bufferString.substring(0, 2)

                let queryStatus = null;
                switch (COMMAND_STATUS) {
                    case "00":
                        queryStatus = "SUCCESS"
                        break
                    case "01":
                        queryStatus = "ERROR"
                        break
                    case "02":
                        queryStatus = "INVALID"
                        break
                    default:
                        queryStatus = "UNKNOWN"
                        break
                }

                this.logger(`[TLV-Q] [${QUERY_ID} - ${queryStatus}]${PAYLOAD || bufferString ? ":" : ""}`, PAYLOAD || bufferString)
                const tlvWaitFor = this.tlvWaitForList.find((a) => a.commandId == QUERY_ID)
                if (tlvWaitFor) {
                    tlvWaitFor.resolve(PAYLOAD)
                    this.tlvWaitForList.splice(this.tlvWaitForList.indexOf(tlvWaitFor), 1)
                }

            } else {


                let commandExecutionStatus = null;
                switch (COMMAND_STATUS) {
                    case "00":
                        commandExecutionStatus = "SUCCESS"
                        break
                    case "01":
                        commandExecutionStatus = "ERROR"
                        break
                    case "02":
                        commandExecutionStatus = "INVALID"
                        break
                    default:
                        commandExecutionStatus = "UNKNOWN"
                        break
                }
                
                this.logger(`[TLV] [${COMMAND_ID} - ${commandExecutionStatus}]${PAYLOAD || bufferString ? ":" : ""}`, buffer.toString("hex"))
                const tlvWaitFor = this.tlvWaitForList.find((a) => a.commandId == COMMAND_ID)
                if (tlvWaitFor) {
                    tlvWaitFor.resolve(PAYLOAD)
                    this.tlvWaitForList.splice(this.tlvWaitForList.indexOf(tlvWaitFor), 1)
                }
            }
        }
    }

    /**
     * @description Check if keep alive is enabled
     * @returns {boolean} If keep alive is enabled
     */
    isKeepAliveEnabled(): boolean {
        return this.keepAlive;
    }

    /**
     * @description Wait for a response from the GoPro (Protobuf)
     * @param featureId - The feature ID of the response
     * @param actionId - The action ID of the response
     * @returns {Promise<any>} The response from the GoPro
    */
    async waitForProtoResponse(featureId: string, actionId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.protoWaitForList.push({ featureId: featureId.toUpperCase(), actionId: actionId.toUpperCase(), resolve, reject })
        })
    }
    
    /**
     * @description Wait for a response from the GoPro (TLV)
     * @param commandId - The command ID of the response
     * @returns {Promise<any>} The response from the GoPro
    */
    async waitForTlvResponse(commandId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.tlvWaitForList.push({ commandId: commandId.toUpperCase(), resolve, reject })
        })
    }
    
    /**
     * @description Disconnect from the GoPro and clean up
     * @returns {Promise<void>}
     */
    async cleanup(): Promise<void> {
        this.logger("Cleaning up...")
        await this.stopListen().catch(()=>{})
        await this.device.disconnect().catch(()=>{})
        destroy()
        this.logger("Cleaned up")
    }

    async sendKeepAlive(): Promise<void> {
        await this.characteristics.request.SETTINGS.writeValue(this.getTLVByteArray("5B","42"))
    }


    //! -- COMMANDS -- !\\

    /**
     * @description Get the GoPro's Access Point information
     * @returns {Promise<{ssid: string, password: string}>} The SSID and password of the GoPro's Access Point
     */
    async getOwnAPInfo(): Promise<{ ssid: string; password: string }> {
        const ssid = (await (await this.services.GP0001.getCharacteristic('b5f90002-aa8d-11e3-9046-0002a5d5c51b')).readValue()).toString('ascii')
        const password = (await (await this.services.GP0001.getCharacteristic('b5f90003-aa8d-11e3-9046-0002a5d5c51b')).readValue()).toString('ascii')

        return {ssid, password}
    }

    async getLiveStreamStatus(): Promise<void> {
        const LiveStreamingProto = protobuf.loadSync('protos/live_streaming.proto')
        const RequestGetLiveStreamStatus = LiveStreamingProto.lookupType('open_gopro.RequestGetLiveStreamStatus')
        const RequestGetLiveStreamStatusData = RequestGetLiveStreamStatus.encode(RequestGetLiveStreamStatus.create({
            
        })).finish()
    
        for (const packet of this.getProtoByteArray("F5", "74", Buffer.from(RequestGetLiveStreamStatusData).toString('hex'))) {
            await this.characteristics.request.COMMAND.writeValue(packet)
        }
    }

    /**
     * @description Get information about the GoPro (name, model number, serial number, firmware revision, battery level)
     * @returns {Promise<{name: string, modelNumber: string, serialNumber: string, firmwareVersion: string, batteryLevel: number, MACAddress: string}>} Information about the GoPro
     */
    async getInfo(): Promise<{ name: string; modelNumber: string; serialNumber: string; firmwareVersion: string; batteryLevel: number, MACAddress: string }> {
        const batteryLevel = await this.getBatteryLevel()

        const modelNumber = (await (await this.services.INFO.getCharacteristic('00002a24-0000-1000-8000-00805f9b34fb')).readValue()).toString('ascii')
        const serialNumber = (await (await this.services.INFO.getCharacteristic('00002a25-0000-1000-8000-00805f9b34fb')).readValue()).toString('ascii')
        const firmwareVersion = (await (await this.services.INFO.getCharacteristic('00002a26-0000-1000-8000-00805f9b34fb')).readValue()).toString('ascii')
        const name = await this.device.getName()
        const MACAddress = await this.device.getAddress()

        return {
            name,
            modelNumber,
            serialNumber,
            firmwareVersion,
            batteryLevel,
            MACAddress
        }
    }

    /**
     * @description Get the battery level of the GoPro (in %)
     * @returns {Promise<number>} The battery level of the GoPro
     */
    async getBatteryLevel(): Promise<number> {
        const tempBattLevel = (await (await this.services.BATTERY.getCharacteristic('00002a19-0000-1000-8000-00805f9b34fb')).readValue()).toString('hex')
        return parseInt(tempBattLevel, 16)
    }

    /**
     * @description Turn off the GoPro
     * @returns {Promise<void>}
     */
    async powerOff(): Promise<void> {
        await this.characteristics.request.COMMAND.writeValue(this.getTLVByteArray("04"))
    }

    /**
     * @description Prevent or allow the camera to go to sleep
     * @returns {Promise<void>}
     */
    async toggleKeepAlive(keepAlive: boolean): Promise<void> {
        this.keepAlive = keepAlive
    }

    /**
     * @description Make the GoPro go to sleep
     * @returns {Promise<void>}
     */
    async sleep(): Promise<void> {
        this.isSleeping = true
        await this.characteristics.request.COMMAND.writeValue(this.getTLVByteArray("05"))
    }

    /**
     * @description Wake & reconnect to the GoPro
     * @returns {Promise<void>}
     */
    async wake(): Promise<void> {
        await this.attemptReconnect(false);
        await sleep(1000);
    }

    /**
     * @description Start scanning for available networks
     * @returns {Promise<void>}
     */
    async scanAvailableAPs(): Promise<void> {
        for (const packet of this.getProtoByteArray("02", "02")) {
            await this.characteristics.request.NETWORK_MANAGEMENT.writeValue(packet)
        }
    }

    async getStatusValues(): Promise<any> {
        await this.characteristics.request.QUERY.writeValue(this.getTLVByteArray("13", "1D", "query"))
    }

    /**
     * @description Tell the camera who is in control
     * @param [external=true] - Whether to claim external control
     * @returns {Promise<void>}
     */
    async claimControl(external: boolean = true) {
        const CameraControlProto = protobuf.loadSync('protos/set_camera_control_status.proto')
        const RequestSetCameraControlStatus = CameraControlProto.lookupType('open_gopro.RequestSetCameraControlStatus')
        const RequestSetCameraControlStatusData = RequestSetCameraControlStatus.encode(RequestSetCameraControlStatus.create({
            cameraControlStatus: external ? "CAMERA_EXTERNAL_CONTROL" : "CAMERA_IDLE"
        })).finish()
    
        for (const packet of this.getProtoByteArray("F1", "69", Buffer.from(RequestSetCameraControlStatusData).toString('hex'))) {
            await this.characteristics.request.COMMAND.writeValue(packet)
        }
    }

    /**
     * @description Get the results of the network scan
     * @param {number} scanId - The scan ID of the network scan
     * @param {number} maxEntries - The maximum number of entries to return (should be the same as the number of entries in the scan)
     * @returns {Promise<void>} 
     */
    async getAPResults(scanId: number, maxEntries: number): Promise<void> {
        const NetworkManagementProto = protobuf.loadSync('protos/network_management.proto')
        const RequestGetApEntries = NetworkManagementProto.lookupType('open_gopro.RequestGetApEntries')
        const getApEntriesData = RequestGetApEntries.encode(RequestGetApEntries.create({
            scanId: scanId,
            maxEntries: maxEntries,
            startIndex: 0
        })).finish()
    
        for (const packet of this.getProtoByteArray("02", "03", Buffer.from(getApEntriesData).toString('hex'))) {
            await this.characteristics.request.NETWORK_MANAGEMENT.writeValue(packet)
        }
    }

    /**
     * @description Connect to a previously configured network
     * @param {string} ssid - The SSID of the network to connect to
     * @returns {Promise<void>}
     */
    async connectToConfiguredAP(ssid: string): Promise<void> {
        const NetworkManagementProto = protobuf.loadSync('protos/network_management.proto')
        const RequestConnect = NetworkManagementProto.lookupType('open_gopro.RequestConnect')
        const requestConnectData = RequestConnect.encode(RequestConnect.create({
            ssid: ssid
        })).finish()
    
        for (const packet of this.getProtoByteArray("02", "04", Buffer.from(requestConnectData).toString('hex'))) {
            await this.characteristics.request.NETWORK_MANAGEMENT.writeValue(packet)
        }
    }

    /**
     * @description Connect to a new network
     * @param {string} ssid - The SSID of the network to connect to
     * @param {string} password - The password of the network to connect to
     * @returns {Promise<void>}
     */
    async connectToNewAP(ssid: string, password: string): Promise<void> {
        const NetworkManagementProto = protobuf.loadSync('protos/network_management.proto')
        const RequestConnectNew = NetworkManagementProto.lookupType('open_gopro.RequestConnectNew')
        const RequestConnectNewData = RequestConnectNew.encode(RequestConnectNew.create({
            ssid: ssid,
            password: password
        })).finish()
    
        for (const packet of this.getProtoByteArray("02", "05", Buffer.from(RequestConnectNewData).toString('hex'))) {
            await this.characteristics.request.NETWORK_MANAGEMENT.writeValue(packet)
        }
    }

    /**
     * @description Set the GoPro into live stream mode (RTMP)
     * @param input.url - RTMP URL
     * @param input.encode - Save live stream to SD card
     * @param input.windowSize - Resolution of the live stream (4 = 480p, 7 = 720p, 12 = 1080p)
     * @param input.minimumBitrate - Minimum desired bitrate
     * @param input.maximumBitrate - Maximum desired bitrate
     * @param input.startingBitrate - Starting bitrate
     * @param input.lens - Lens type (0 = Wide, 4 = SuperView, 3 = Linear)
     */
    async setLiveStreamMode(input: {
        url: string,
        encode?: boolean,
        windowSize?: 4 | 7 | 12
        minimumBitrate?: number,
        maximumBitrate?: number,
        startingBitrate?: number,
        lens?: 0 | 4 | 3,
    }) {
        const LiveStreamProto = protobuf.loadSync('protos/live_streaming.proto')
        const RequestSetLiveStreamMode = LiveStreamProto.lookupType('open_gopro.RequestSetLiveStreamMode')
        let RequestSetLiveStreamModeData = RequestSetLiveStreamMode.encode(RequestSetLiveStreamMode.create(input)).finish()
    
        for (const packet of this.getProtoByteArray("f1", "79", Buffer.from(RequestSetLiveStreamModeData).toString('hex'))) {
            await this.characteristics.request.COMMAND.writeValue(packet)
        }
    }


    /**
     * @description Take a picture / Start Recording/Streaming
     * @returns {Promise<void>}
     */
    async startCapture(): Promise<void> {
        await this.characteristics.request.COMMAND.writeValue(this.getTLVByteArray("01", "01"))
    }
    
    /**
     * @description Stop Recording/Streaming
     * @returns {Promise<void>}
     */
    async stopCapture(): Promise<void> {
        await this.characteristics.request.COMMAND.writeValue(this.getTLVByteArray("01", "00"))
    }
    
    /**
     * @description Set the GoPro's resolution
     * @param resolution - The resolution to set the GoPro to (4k, 2.7k, 1080p)
     * @returns {Promise<void>}
     */
    async setResolution(resolution: "4k" | "2.7k" | "1080p"): Promise<void> {
        const ResolutionIdMap = {
            "4k": "1",
            "2.7k": "4",
            "1080p": "9"
        }
    
        await this.characteristics.request.SETTINGS.writeValue(this.getTLVByteArray("02", parseInt(ResolutionIdMap[resolution]).toString(16).padStart(2, '0')))
    }
    
    /**
     * @description Set the GoPro's frame rate
     * @param fps - The frame rate to set the GoPro to (240, 200, 120, 100, 60, 50, 30, 25, 24)
     * @returns {Promise<void>}
     */
    async setFPS(fps: 240 | 200 | 120 | 100 | 60 | 50 | 30 | 25 | 24): Promise<void> {
        const FPSIdMap = {
            "240": "0",
            "200": "13",
            "120": "1",
            "100": "2",
            "60": "5",
            "50": "6",
            "30": "8",
            "25": "9",
            "24": "10"
        }
    
        await this.characteristics.request.SETTINGS.writeValue(this.getTLVByteArray("03", parseInt(FPSIdMap[fps.toString()]).toString(16).padStart(2, '0')))
    }

    /**
     * @description Set stabilization
     * @param enabled - Whether to enable stabilization
     * @returns {Promise<void>}
     */
    async setStabilization(enabled: boolean): Promise<void> {
        await this.setSetting(135, enabled ? "01" : "00") 
    }


    async setSetting(settingId: number | string, value: string) {
        if (typeof settingId === 'number') {
            settingId = settingId.toString(16).padStart(2, '0')
        }

        console.log(this.getTLVByteArray(settingId, value))

        await this.characteristics.request.SETTINGS.writeValue(this.getTLVByteArray(settingId, value))
    }


    //! -- COMMANDS -- !\\




    //! Helper functions
    private getTLVByteArray(commandId: string, payload?: string, type: "query" | "command" | "settings" | "network_management" = "command") {
        const commandIdBuffer = Buffer.from(commandId, 'hex')
        if (!!payload) {
            const payloadBuffer = Buffer.from(payload, 'hex')
            const lengthDenotation = Buffer.from([payloadBuffer.length + (type == "query" ? 1 : 2)])
            const payloadLengthDenotation = Buffer.from([payloadBuffer.length])
            if (type == "query") {
                return Buffer.concat([lengthDenotation, commandIdBuffer, payloadBuffer])
            } else {
                return Buffer.concat([lengthDenotation, commandIdBuffer, payloadLengthDenotation, payloadBuffer])
            }
        } else {
            const lengthDenotation = Buffer.from([1])
            return Buffer.concat([lengthDenotation, commandIdBuffer])

        }
    }
    
    private getProtoByteArray(featureId: string, actionId: string, payload?: string) {
        const featureIdBuffer = Buffer.from(featureId, 'hex')
        const commandIdBuffer = Buffer.from(actionId, 'hex')
        const payloadBuffer = Buffer.from(!!payload ? payload : "", 'hex')
        const lengthDenotationBuffer = Buffer.from([payloadBuffer.length + 2])
    
        return this.splitBuffer(Buffer.concat([lengthDenotationBuffer, featureIdBuffer, commandIdBuffer, payloadBuffer]))
    }

    private splitBuffer(buffer: Buffer) {
        const packets = []
        const packetLength = 19
    
        if (buffer.length <= 20) {
            return [buffer]
        }
    
        //! Strip the first byte (length denotation)
        buffer = buffer.subarray(1)

        const length = buffer.length
    
        const initializationBits = "001"
    
        // convert the length to binary and pad it to 13 bits
        const lengthBinary = length.toString(2).padStart(13, '0')
    
        const lengthHex = this.bin2hex(initializationBits + lengthBinary.substring(0, 5)) + this.bin2hex(lengthBinary.substring(5))
    
        const firstPacket = Buffer.concat([Buffer.from(lengthHex, 'hex'), buffer.subarray(0, packetLength-1)])
        packets.push(firstPacket)
    
        let i = packetLength-1
    
        let counter = -1
        while (i < buffer.length) {
            counter++
            packets.push(Buffer.concat([Buffer.from(this.bin2hex("1" + counter.toString(2).padStart(7, '0')), "hex"),buffer.subarray(i, i + packetLength)]))
            i += packetLength
        }
        return packets
    }
    private hex2bin(hex: string){
        return (parseInt(hex, 16).toString(2)).padStart(8, '0');
    }
    
    private bin2hex(bin: string){
        return parseInt(bin, 2).toString(16);
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}