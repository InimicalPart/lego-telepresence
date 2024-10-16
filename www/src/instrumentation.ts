import NodeMediaServer from 'node-media-server';
import { LTPGlobal } from './interfaces/global';

declare const global: LTPGlobal;

global.connections = [];
global.nms = null;



export async function register() {
    if (process.env.NEXT_RUNTIME === 'edge') return;
    await setupRTMP();
}

async function setupRTMP() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
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
                allow_origin: 'localhost',
                mediaroot: './media',
            },
            logType: 0
        })
        nms.run();
        global.nms = nms;
    }
}