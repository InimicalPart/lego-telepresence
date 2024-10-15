import { config } from 'dotenv'
import protobuf, { Message } from 'protobufjs'

config()

const {createBluetooth} = await import('node-ble')
const {bluetooth, destroy} = createBluetooth()
const adapter = await bluetooth.defaultAdapter()

const NETWORK_NAME = process.env.NETWORK_NAME
const NETWORK_PASSWORD = Buffer.from(process.env.NETWORK_PASS,"base64").toString("ascii")

console.log("Attempting to connect with GoPro")
const device = await adapter.getDevice("F4:17:C1:E1:0C:0C")
await device.connect()

const featureIds = [
    "02",
    "f1",
    "f5"
]

const actionIds = [
    "02",
    "03",
    "04",
    "05",
    "0b",
    "0c",
    "82",
    "83",
    "84",
    "85",
    "64",
    "65",
    "66",
    "67",
    "69",
    "6b",
    "79",
    "e4",
    "e5",
    "e6",
    "e7",
    "e9",
    "eb",
    "f9",
    "6d",
    "6e",
    "6f",
    "72",
    "74",
    "ed",
    "ee",
    "ef",
    "f2",
    "f3",
    "f4",
    "f5"
]


const protomap = {
    "0202": {"type":"Request", "file":"network_management.proto", "name":"RequestStartScan"},
    "0203": {"type":"Request", "file":"network_management.proto", "name":"RequestGetApEntries"},
    "0204": {"type":"Request", "file":"network_management.proto", "name":"RequestConnect"},
    "0205": {"type":"Request", "file":"network_management.proto", "name":"RequestConnectNew"},
    "020B": {"type":"Notification", "file":"network_management.proto", "name":"NotifStartScanning"},
    "020C": {"type":"Notification", "file":"network_management.proto", "name":"NotifProvisioningState"},
    "0282": {"type":"Response", "file":"network_management.proto", "name":"ResponseStartScanning"},
    "0283": {"type":"Response", "file":"network_management.proto", "name":"ResponseGetApEntries"},
    "0284": {"type":"Response", "file":"network_management.proto", "name":"ResponseConnect"},
    "0285": {"type":"Response", "file":"network_management.proto", "name":"ResponseConnectNew"},
    "F164": {"type":"Request", "file":"preset_status.proto", "name":"RequestCustomPresetUpdate"},
    "F165": {"type":"Request", "file":"cohn.proto", "name":"RequestSetCOHNSetting"},
    "F166": {"type":"Request", "file":"cohn.proto", "name":"RequestClearCOHNCert"},
    "F167": {"type":"Request", "file":"cohn.proto", "name":"RequestCreateCOHNCert"},
    "F169": {"type":"Request", "file":"set_camera_control_status.proto", "name":"RequestSetCameraControlStatus"},
    "F16B": {"type":"Request", "file":"turbo_transfer.proto", "name":"RequestSetTurboActive"},
    "F179": {"type":"Request", "file":"live_streaming.proto", "name":"RequestSetLiveStreamMode"},
    "F1E4": {"type":"Response", "file":"response_generic.proto", "name":"ResponseGeneric"},
    "F1E5": {"type":"Response", "file":"response_generic.proto", "name":"ResponseGeneric"},
    "F1E6": {"type":"Response", "file":"response_generic.proto", "name":"ResponseGeneric"},
    "F1E7": {"type":"Response", "file":"response_generic.proto", "name":"ResponseGeneric"},
    "F1E9": {"type":"Response", "file":"response_generic.proto", "name":"ResponseGeneric"},
    "F1EB": {"type":"Response", "file":"response_generic.proto", "name":"ResponseGeneric"},
    "F1F9": {"type":"Response", "file":"response_generic.proto", "name":"ResponseGeneric"},
    "F56D": {"type":"Request", "file":"media.proto", "name":"RequestGetLastCapturedMedia"},
    "F56E": {"type":"Request", "file":"cohn.proto", "name":"RequestCOHNCert"},
    "F56F": {"type":"Request", "file":"cohn.proto", "name":"RequestGetCOHNStatus"},
    "F572": {"type":"Request", "file":"request_get_preset_status", "name":"RequestGetPresetStatus"},
    "F574": {"type":"Request", "file":"live_streaming.proto", "name":"RequestGetLiveStreamStatus"},
    "F5ED": {"type":"Response", "file":"media.proto", "name":"ResponseLastCapturedMedia"},
    "F5EE": {"type":"Response", "file":"cohn.proto", "name":"ResponseCOHNCert"},
    "F5EF": {"type":"Response", "file":"cohn.proto", "name":"NotifyCOHNStatus"},
    "F5F2": {"type":"Response", "file":"preset_status.proto", "name":"NotifyPresetStatus"},
    "F5F3": {"type":"Notification", "file":"preset_status.proto", "name":"NotifyPresetStatus"},
    "F5F4": {"type":"Response", "file":"live_streaming.proto", "name":"NotifyLiveStreamStatus"},
    "F5F5": {"type":"Notification", "file":"live_streaming.proto", "name":"NotifyLiveStreamStatus"}
}


if (!device.isPaired()) {
    console.log("GoPro is not paired, attempting to pair")
    try {
        await device.pair()
    } catch (e) {
        console.log(e)
    }
} else {
    console.log("GoPro is already paired")
}
console.log("Connected to GoPro")


console.log("Getting GATT server")
const gattServer = await device.gatt()


console.log("Getting primary service: FEA6")
const FEA6 = await gattServer.getPrimaryService('0000fea6-0000-1000-8000-00805f9b34fb')
const GP0090 = await gattServer.getPrimaryService('b5f90090-aa8d-11e3-9046-0002a5d5c51b')

console.log("Getting characteristics")
const COMMAND = await FEA6.getCharacteristic('b5f90072-aa8d-11e3-9046-0002a5d5c51b')
const COMMAND_RESP = await FEA6.getCharacteristic('b5f90073-aa8d-11e3-9046-0002a5d5c51b')
const NETWORK_MANAGEMENT = await GP0090.getCharacteristic('b5f90091-aa8d-11e3-9046-0002a5d5c51b')
const NETWORK_MANAGEMENT_RESP = await GP0090.getCharacteristic('b5f90092-aa8d-11e3-9046-0002a5d5c51b')
console.log("Subscribing to characteristic2")
await COMMAND_RESP.startNotifications()
await NETWORK_MANAGEMENT_RESP.startNotifications()

COMMAND_RESP.on('valuechanged', parseIncomingMessage)
NETWORK_MANAGEMENT_RESP.on('valuechanged', parseIncomingMessage)

const protoWaitForList = []
const tlvWaitForList = []


async function waitForProto(featureId: string, actionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
        protoWaitForList.push({ featureId: featureId.toUpperCase(), actionId: actionId.toUpperCase(), resolve, reject })
    })
}

async function waitForTlv(commandId: string): Promise<any> {
    return new Promise((resolve, reject) => {
        tlvWaitForList.push({ commandId: commandId.toUpperCase(), resolve, reject })
    })
}


let cutOffMap = {
    // "0102": {"reportedLength": 28, "completeString": "", "lastCounter": -1, "type": 13 } // type is bit length
}
function parseIncomingMessage(buffer: Buffer) {
    const firstByte = buffer.toString("hex").substring(0, 2)
    const bin = hex2bin(firstByte)
    if (bin[0] == "1") {
        // is continuation packet
        const counter = parseInt(bin.substring(1), 2)

        Object.values(cutOffMap).every((a: {
            reportedLength: number,
            completeString: string,
            lastCounter: number,
            type: number
        }) => {
            if (a.lastCounter == counter - 1) {
                
                a.lastCounter = counter
                a.completeString += buffer.toString("hex").substring(2)
                console.log("Continuation packet found (length: " + (a.completeString.length/2) + " / " + a.reportedLength + ")")
                if (a.completeString.length/2 == a.reportedLength) {
                    console.log("Complete message found")
                    cutOffMap = {}
                    parseIncomingMessage(Buffer.concat([Buffer.from("00","hex"), Buffer.from(a.completeString, 'hex')])) // reparse
                }
                return false
            }
            return true
        })
        return
    }

    for (const key in protomap) {
        if (buffer.toString("hex").substring(0, 2) == "00") {
            break
        }
        let allowed = [2,4,6]
        if (buffer.toString("hex").toLowerCase().includes(key.toLowerCase())) {
            if (allowed.includes(buffer.toString("hex").indexOf(key.toLowerCase()))) {
                const firstByte = buffer.toString("hex").substring(0, 2)
                const binarized = hex2bin(firstByte)

                let length = 0;
                let type = 0;

                if (binarized[1] == "0" && binarized[2] == "0") {
                    // 5-bit length
                    length = parseInt(binarized.substring(3), 2)
                    type = 5
                } else if (binarized[1] == "0" && binarized[2] == "1") {
                    // 13-bit length
                    const firstTwoBytes = buffer.toString("hex").substring(0, 4)
                    const binarized = hex2bin(firstTwoBytes)

                    length = parseInt(binarized.substring(3), 2)
                    type = 13
                } else if (binarized[1] == "1") {
                    // 16-bit length
                    const lengthBytes = buffer.toString("hex").substring(2, 6)
                    const binarized = hex2bin(lengthBytes)

                    length = parseInt(binarized, 2)
                    type = 16
                }                

                if (length != buffer.length - 1) {
                    if (!cutOffMap[key]) {
                        console.log("Received cut off message, waiting for continuation")
                        cutOffMap[key] = {"reportedLength": length, "completeString": buffer.toString("hex").substring(buffer.toString("hex").indexOf(key.toLowerCase())), lastCounter: -1, type }
                        return;       
                    }
                }
            }
        }
    }

    const bufferString = buffer.toString("hex").substring(2) // remove first 2 bytes (length)
    const FEATURE_ID = bufferString.substring(0, 2).toUpperCase() ?? "--"
    const ACTION_ID = bufferString.substring(2, 4).toUpperCase() ?? "--"
    const SERIALIZED = bufferString.substring(4)

    const COMMAND_ID = bufferString.substring(0, 2)
    const COMMAND_STATUS = bufferString.substring(2, 4)
    const PAYLOAD = bufferString.substring(4)


    let messageType = null

    if (featureIds.includes(FEATURE_ID.toLowerCase())) {
        if (actionIds.includes(ACTION_ID.toLowerCase())) {
            messageType = "proto"
        } else {
            messageType = "tlv"
        }
    } else {
        messageType = "tlv"
    }


    if (messageType == "proto") {
        const messageTypeSpec = protomap[FEATURE_ID.toUpperCase() + ACTION_ID.toUpperCase()]
        if (messageTypeSpec) {
            const typeSpec = protobuf.loadSync("protos/" + messageTypeSpec.file)
            const messageType = typeSpec.lookupType("open_gopro." + messageTypeSpec.name)

            const message = messageType.decode(Buffer.from(SERIALIZED, 'hex'))
            console.log(`[PROTO] [${FEATURE_ID.toUpperCase() + ACTION_ID.toUpperCase()} - ${messageTypeSpec.name}]:`, message)

            const protoWaitFor = protoWaitForList.find((a) => a.featureId == FEATURE_ID && a.actionId == ACTION_ID)
            if (protoWaitFor) {
                protoWaitFor.resolve(message)
                protoWaitForList.splice(protoWaitForList.indexOf(protoWaitFor), 1)
            }
        }
    } else {
        let niceCommandStatus = null;
        switch (COMMAND_STATUS) {
            case "00":
                niceCommandStatus = "SUCCESS"
                break
            case "01":
                niceCommandStatus = "ERROR"
                break
            case "02":
                niceCommandStatus = "INVALID"
                break
            default:
                niceCommandStatus = "UNKNOWN"
                break
        }
        
        console.log(`[TLV] [${COMMAND_ID} - ${niceCommandStatus}]:`, PAYLOAD)

        const tlvWaitFor = tlvWaitForList.find((a) => a.commandId == COMMAND_ID)
        if (tlvWaitFor) {
            tlvWaitFor.resolve(PAYLOAD)
            tlvWaitForList.splice(tlvWaitForList.indexOf(tlvWaitFor), 1)
        }
    }
}

console.log("Scanning for APs")
await scanAPs()

let scanId	= null;
let totalEntries = 0
while (true) {
    const response = await waitForProto("02", "0B")
    if (response.scanningState == 5) {
        console.log("Scanning done")
        scanId = response.scanId
        totalEntries = response.totalEntries
        break
    }
}

await getAPResults(scanId, totalEntries)
const aps = await waitForProto("02", "83")

const ap = aps.entries.find((a: any) => a.ssid == NETWORK_NAME)

if (!ap) {
    console.log("AP not found")
    process.exit(1)
}

console.log("AP found!")


// not connected
if ((8 & ap.scanEntryFlags) != 8) {
    // not saved
    if ((2 & ap.scanEntryFlags) != 2) {
        console.log("AP not saved, connecting")
        await connectToNewAP(NETWORK_NAME, NETWORK_PASSWORD)
    } else {
        console.log("AP saved, connecting")
        await connectToAP(NETWORK_NAME)
    }

    while (true) {
        const response = await waitForProto("02", "0C")
        if (response.provisioningState == 5 || response.provisioningState == 6) {
            console.log("Provisioning done")
            break
        } else {
            const provisioningStateMap = {
                "0": "PROVISIONING_UNKNOWN",	
                "1": "PROVISIONING_NEVER_STARTED",	
                "2": "PROVISIONING_STARTED",	
                "3": "PROVISIONING_ABORTED_BY_SYSTEM",	
                "4": "PROVISIONING_CANCELLED_BY_USER",
                //! 5 and 6 are success
                "7": "PROVISIONING_ERROR_FAILED_TO_ASSOCIATE",	
                "8": "PROVISIONING_ERROR_PASSWORD_AUTH",	
                "9": "PROVISIONING_ERROR_EULA_BLOCKING",	
                "10": "PROVISIONING_ERROR_NO_INTERNET",	
                "11": "PROVISIONING_ERROR_UNSUPPORTED_TYPE"
            }
            
            console.log("Provisioning state err:", provisioningStateMap[response.provisioningState.toString()])
            process.exit(1)
        }
    }
} else {
    console.log("AP already connected")
}

await setLiveStream({
    url: `rtmp://${process.env.RTMP_HOST}/remotelive/${(await device.getName()).replace(" ", "_")}`,
    encode: false,
    windowSize: 12,
    lens: 4
})

console.log("Live stream set")
console.log("Waiting for live stream to be ready")
await getLiveStreamStatuses()
while (true) {
    const response = await waitForProto("f5", "f5")
    if (response.liveStreamStatus == 2) {
        console.log("Live stream is ready")
        break
    }
}

await startCapture()

console.log("Live stream started")



// await takeOverControl()

async function startCapture() {
    COMMAND.writeValue(getByteArray("01", "01"))
}

async function stopCapture() {
    COMMAND.writeValue(getByteArray("01", "00"))
}

async function setLiveStream(input: {
    url: string, // RTMP(S) URL used for live stream
    encode?: boolean, // Save media to sdcard while streaming?
    windowSize?: 4|7|12
    minimumBitrate?: number, // Minimum desired bitrate (may or may not be honored)
    maximumBitrate?: number, // Maximum desired bitrate (may or may not be honored)
    startingBitrate?: number, // Starting bitrate
    lens?: 0|4|3,
}) {
    const LiveStreamMsg = protobuf.loadSync('protos/live_streaming.proto')
    const LiveStream = LiveStreamMsg.lookupType('open_gopro.RequestSetLiveStreamMode')
    var serializedMessage = LiveStream.create(input)
    let serializedMessage2 = LiveStream.encode(serializedMessage).finish()

    console.log("Writing to characteristic1")

    for (const packet of getProtoBufArray("f1", "79", Buffer.from(serializedMessage2).toString('hex'))) {
        await COMMAND.writeValue(packet)
    }
}

async function waitUntilReady() {


}


async function connectToNewAP(ssid: string, password: string) {
    const NetworkManagementMsg = protobuf.loadSync('protos/network_management.proto')
    const NetworkManagement = NetworkManagementMsg.lookupType('open_gopro.RequestConnectNew')
    var serializedMessage: Message = NetworkManagement.create({
        ssid: ssid,
        password: password
    })
    let serializedMessage2 = NetworkManagement.encode(serializedMessage).finish()

    for (const packet of getProtoBufArray("02", "05", Buffer.from(serializedMessage2).toString('hex'))) {
        await NETWORK_MANAGEMENT.writeValue(packet)
    }
}

async function connectToAP(ssid: string) {
    const NetworkManagementMsg = protobuf.loadSync('protos/network_management.proto')
    const NetworkManagement = NetworkManagementMsg.lookupType('open_gopro.RequestConnect')
    var serializedMessage: Message = NetworkManagement.create({
        ssid: ssid
    })
    let serializedMessage2 = NetworkManagement.encode(serializedMessage).finish()

    for (const packet of getProtoBufArray("02", "04", Buffer.from(serializedMessage2).toString('hex'))) {
        await NETWORK_MANAGEMENT.writeValue(packet)
    }
}

async function getAPResults(scanId: number, maxEntries: number) {
    console.log("Scan ID:", scanId)
    const NetworkManagementMsg = protobuf.loadSync('protos/network_management.proto')
    const NetworkManagement = NetworkManagementMsg.lookupType('open_gopro.RequestGetApEntries')
    var serializedMessage: Message = NetworkManagement.create({
        scanId: scanId,
        maxEntries: maxEntries,
        startIndex: 0
    })
    let serializedMessage2 = NetworkManagement.encode(serializedMessage).finish()

    for (const packet of getProtoBufArray("02", "03", Buffer.from(serializedMessage2).toString('hex'))) {
        await NETWORK_MANAGEMENT.writeValue(packet)
    }
}

async function scanAPs() {
    const NetworkManagementMsg = protobuf.loadSync('protos/network_management.proto')
    const NetworkManagement = NetworkManagementMsg.lookupType('open_gopro.RequestStartScan')
    var serializedMessage: Message = NetworkManagement.create()
    let serializedMessage2 = NetworkManagement.encode(serializedMessage).finish()

    for (const packet of getProtoBufArray("02", "02", Buffer.from(serializedMessage2).toString('hex'))) {
        await NETWORK_MANAGEMENT.writeValue(packet)
    }
}

async function takeOverControl() {
    const LiveStreamMsg = protobuf.loadSync('protos/set_camera_control_status.proto')
    const LiveStream = LiveStreamMsg.lookupType('open_gopro.RequestSetCameraControlStatus')
    var serializedMessage: Message = LiveStream.create({
        cameraControlStatus: 2
    })
    let serializedMessage2 = LiveStream.encode(serializedMessage).finish()

    for (const packet of getProtoBufArray("f1", "69", Buffer.from(serializedMessage2).toString('hex'))) {
        await COMMAND.writeValue(packet)
    }
}

async function getLiveStreamStatuses() {
    const LiveStreamMsg = protobuf.loadSync('protos/live_streaming.proto')
    const LiveStream = LiveStreamMsg.lookupType('open_gopro.RequestGetLiveStreamStatus')
    var serializedMessage: Message = LiveStream.create({
        registerLiveStreamStatus: [1]
    })
    let serializedMessage2 = LiveStream.encode(serializedMessage).finish()

    console.log(getProtoBufArray("f5", "74", Buffer.from(serializedMessage2).toString('hex')))

    for (const packet of getProtoBufArray("f5", "74", Buffer.from(serializedMessage2).toString('hex'))) {
        await COMMAND.writeValue(packet)
    }
}

async function stopGetLiveStreamStatuses() {
    const LiveStreamMsg = protobuf.loadSync('protos/live_streaming.proto')
    const LiveStream = LiveStreamMsg.lookupType('open_gopro.RequestGetLiveStreamStatus')
    var serializedMessage: Message = LiveStream.create({
        unregisterLiveStreamStatus: [1,2,3,4]
    })
    let serializedMessage2 = LiveStream.encode(serializedMessage).finish()

    for (const packet of getProtoBufArray("f5", "74", Buffer.from(serializedMessage2).toString('hex'))) {
        await COMMAND.writeValue(packet)
    }
}



function getByteArray(commandId: string, payload: string) {
    const commandIdBuffer = Buffer.from(commandId, 'hex')
    const payloadBuffer = Buffer.from(payload, 'hex')
    const lengthBuffer = Buffer.from([payloadBuffer.length + 2])
    const valLength = Buffer.from([payloadBuffer.length])
    return Buffer.concat([lengthBuffer, commandIdBuffer, valLength, payloadBuffer])
}

function getProtoBufArray(featureId: string, actionId: string, payload: string) {
    const featureIdBuffer = Buffer.from(featureId, 'hex')
    const commandIdBuffer = Buffer.from(actionId, 'hex')
    const payloadBuffer = Buffer.from(payload, 'hex')

    if (Buffer.concat([featureIdBuffer, commandIdBuffer, payloadBuffer]).length + 1 > 20) {
        const bufferSplit = splitBuffer(Buffer.concat([featureIdBuffer, commandIdBuffer, payloadBuffer]))
        return bufferSplit as Buffer[]
    } else {
        const lengthBuffer = Buffer.from([payloadBuffer.length + 2])

        return [Buffer.concat([lengthBuffer, featureIdBuffer, commandIdBuffer, payloadBuffer])]
    }
}

function splitBuffer(buffer: Buffer) {
    const packets = []
    const packetLength = 19

    if (buffer.length <= 20) {
        return [buffer]
    }

    const length = buffer.length

    const initializationBits = "001"

    // convert the length to binary and pad it to 13 bits
    const lengthBinary = length.toString(2).padStart(13, '0')

    const lengthHex = bin2hex(initializationBits + lengthBinary.substring(0, 5)) + bin2hex(lengthBinary.substring(5))

    const firstPacket = Buffer.concat([Buffer.from(lengthHex, 'hex'), buffer.subarray(0, packetLength-1)])
    packets.push(firstPacket)

    let i = packetLength-1

    let counter = -1
    while (i < buffer.length) {
        counter++
        packets.push(Buffer.concat([Buffer.from(bin2hex("1" + counter.toString(2).padStart(7, '0')), "hex"),buffer.subarray(i, i + packetLength)]))
        i += packetLength
    }

    // console.log("Packets:", packets.length)
    // console.log("Buffer length:", buffer.length)
    // console.log("Packet lengths:", packets.map((a) => a.length))
    // console.log("Packet hex:", packets.map((a) => a.toString('hex')))
    return packets
}

function hex2bin(hex){
    return ((parseInt(hex, 16)).toString(2)).padStart(8, '0');
}

function bin2hex(bin){
    return parseInt(bin, 2).toString(16);
}