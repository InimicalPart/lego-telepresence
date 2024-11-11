import NodeMediaServer from 'node-media-server';
import { LTPGlobal } from './interfaces/global';
import EventEmitter from 'events';

declare const global: LTPGlobal;

global.connections = [];
global.nms = null;
global.events = new EventEmitter();

async function randomString(length: number) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
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
    })

    global.events.on('streamDisconnect', async (data) => {
        console.log(`Stream disconnected: ${data.app}/${data.name}`);

        //find camera that has *.cam.ssid == data.name, then set isLive to false
        const cam = global.connections.find(cam => cam.cam?.ssid == data.name);

        if (cam && cam.cam?.isLive) {
            console.log("Setting camera to not live");
            cam.cam.isLive = false;
        }
    })

    global.events.on('clientConnect', async (data) => {
        console.log(`Client connected: ${data.app}/${data.name}`);
    })

    global.events.on('clientDisconnect', async (data) => {
        console.log(`Client disconnected: ${data.app}/${data.name}`);
    })
    await setupRTMP();
}

async function setupRTMP() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const APIUSER = await randomString(32);
        const APIPASS = await randomString(32);
    
        console.log(`API User: ${APIUSER}`);
        console.log(`API Pass: ${APIPASS}`);

        const NodeMediaServer = await import('node-media-server');
        var nms = new NodeMediaServer.default({
            rtmp: {
                port: 1935,
                chunk_size: 60000,
                gop_cache: true,
                ping: 30,
                ping_timeout: 60
            },
            http: {
                port: 8000,
                allow_origin: 'http://localhost:3000',
                mediaroot: './media',
            },
            auth: {
                api: true,
                api_user: APIUSER,
                api_pass: APIPASS,
            },
            logType: 0
        })
        nms.run();

        nms.on('postPublish', async (id, StreamPath, args) => {
            const streamPath = StreamPath.split("/").filter((x: string) => x != "");

            const app = streamPath[0];
            const streamName = streamPath[1];

            global.events.emit('streamConnect', {
                id: id,
                name: streamName,
                app: app,
            });

        });
          

        nms.on('donePublish', async (id, StreamPath, args) => {
            const streamPath = StreamPath.split("/").filter((x: string) => x != "");

            const app = streamPath[0];
            const streamName = streamPath[1];

            global.events.emit('streamDisconnect', {
                id: id,
                name: streamName,
                app: app,
            });

        });


        nms.on('postConnect', async (id, args: any) => {
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
        
        nms.on('doneConnect', async (id, args: any) => {
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