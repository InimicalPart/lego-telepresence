import { LTPGlobal } from "@/interfaces/global";

declare const global: LTPGlobal;

export async function generateWSID() {
    function getID() {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < 16; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result
    }


    let result = getID();
    while (global.connections.some(conn => conn.id === result)) {
        result = getID();
    }
    return result;
}