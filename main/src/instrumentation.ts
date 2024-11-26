import { LTPGlobal } from './interfaces/global';
import EventEmitter from 'events';

declare const global: LTPGlobal;

global.connections = [];
global.nms = null;
global.events = new EventEmitter();
global.streamMap = new Map();


async function randomString(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


export async function register() {
    if (process.env.NEXT_RUNTIME === 'edge') return;

    global.events.on('streamConnect', async (data) => {
        console.log(`Stream connected: ${data.app}/${data.name}`);

        //find camera that has *.cam.ssid == data.name, then set isLive to true
        const cam = global.connections.find(cam => cam.cam?.ssid == data.name);

        if (cam && cam.cam && !cam.cam?.isLive) {
            console.log("Setting camera to live");
            cam.cam.isLive = true;
        }

        if (cam && cam.cam) {
            global.streamMap.set(data.name, global.nms?.getSession(data.id) as any);
        }

    })

    global.events.on('streamDisconnect', async (data) => {
        console.log(`Stream disconnected: ${data.app}/${data.name}`);

        //find camera that has *.cam.ssid == data.name, then set isLive to false
        const cam = global.connections.find(cam => cam.cam?.ssid == data.name);

        if (cam && cam.cam?.isLive) {
            console.log("Setting camera to not live");
            cam.cam.isLive = false;
        }

        if (global.streamMap.has(data.name)) {
            global.streamMap.delete(data.name);
        }
    })

    global.events.on('clientConnect', async (data) => {
        console.log(`Client connected: ${data.app}/${data.name}`);
    })

    global.events.on('clientDisconnect', async (data) => {
        console.log(`Client disconnected: ${data.app}/${data.name}`);
    })
    await setupEventRegistrars()
    await setupRTMP();
    await setupDefUser();
}

async function setupEventRegistrars() {
    global.eventRegistrars = {}


    global.validEvents = [
        "accessoryPreConnect",
        "accessoryConnect",
        "accessoryPreDisconnect",
        "accessoryDisconnect",
        "carPreConnect",
        "carConnect",
        "carPreDisconnect",
        "carDisconnect",
        "camPreConnect",
        "camConnect",
        "camPreDisconnect",
        "camDisconnect",
        "systemReceived",
        "streamConnect",
        "streamDisconnect",
        "clientConnect",
        "clientDisconnect",
        "carClaimed",
        "carUnclaimed",
        "camStreamRestart",
        "camStreamRestartComplete",
        "accessoryCoolingDown",
        "accessoryCoolingDownComplete",
    ]


    for (const event of global.validEvents) {
        global.events.on(event, (...args) => {
            const registrars = global.eventRegistrars;
            for (const key in registrars) {
                registrars[key].forEach(reg => {
                    if (reg.event === event) {
                        reg.callback({type:event, data:args[0]});
                    }
                })
            }
        })
    }
}

async function setupDefUser() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const credManager = await import('@/utils/auth/credentialManager');

        if (!credManager.userExists("admin")) {
            console.log("User admin does not exist, creating...");
            await credManager.createUser("admin", "ltpwebadmin", "SYSTEM").then((user) => {
                console.log("User admin created successfully!");
                console.log("-------------------------")
                console.log("UUID: " + user.uuid);
                console.log("Username: admin");
                console.log("Password: ltpwebadmin");
                console.log("-------------------------")
            })
        }
    }
}

async function setupRTMP() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const misc = await import('./utils/misc');
        const rtmp = await import('./utils/rtmp');
    
        global.rtmpSecret = await misc.generateRandomHex(16);
        console.log(`RTMP Secret: ${global.rtmpSecret}`);
        const APIUSER = await randomString(32);
        const APIPASS = await randomString(32);
        console.log(`API User: ${APIUSER}`);
        console.log(`API Pass: ${APIPASS}`);

        const tempRTMP = await rtmp.getRtmpUrl("TestSource", "temp");
        console.log(`Temporary RTMP URL: ${tempRTMP.url}`)
        console.log(`Temporary RTMP Expiry: ${tempRTMP.expiresAt.toLocaleString()}`)


        const NodeMediaServer = await import('node-media-server');
        const nms = new NodeMediaServer.default({
            rtmp: {
                port: 1935,
                chunk_size: 60000,
                gop_cache: true,
                ping: 30,
                ping_timeout: 60
            },
            http: {
                port: process.env.NODE_ENV == "development" ? 8000 : 4729,
                allow_origin: '*',
                mediaroot: './media',
            },
            auth: {
                api: true,
                api_user: APIUSER,
                api_pass: APIPASS,
                secret: global.rtmpSecret,
                publish: true
            },
            logType: 3
        })
        nms.run();
        nms.on('postPublish', async (id, StreamPath) => {
            const streamPath = StreamPath.split("/").filter((x: string) => x != "");

            const app = streamPath[0];
            const streamName = streamPath[1];

            global.events.emit('streamConnect', {
                id: id,
                name: streamName,
                app: app,
            });

        });
          

        nms.on('donePublish', async (id, StreamPath) => {
            const streamPath = StreamPath.split("/").filter((x: string) => x != "");

            const app = streamPath[0];
            const streamName = streamPath[1];

            global.events.emit('streamDisconnect', {
                id: id,
                name: streamName,
                app: app,
            });

        });


        //@ts-expect-error - NodeMediaServer has wrong types
        nms.on('postConnect', async (id, args: {streamPath:string}) => {
            if (!Object.keys(args).includes("app")) {                
                const streamPath = args.streamPath.split("/").filter((x: string) => x != "");

                const app = streamPath[0];
                const streamName = streamPath[1];

                global.events.emit('clientConnect', {
                    id: id,
                    name: streamName,
                    app: app,
                });
            }
        });
        
        //@ts-expect-error - NodeMediaServer has wrong types
        nms.on('doneConnect', async (id, args: {streamPath:string}) => {
            if (!Object.keys(args).includes("app")) {                
                const streamPath = args.streamPath.split("/").filter((x: string) => x != "");

                const app = streamPath[0];
                const streamName = streamPath[1];

                global.events.emit('clientDisconnect', {
                    id: id,
                    name: streamName,
                    app: app,
                });

            }
        });
        global.nms = nms;
    }
}