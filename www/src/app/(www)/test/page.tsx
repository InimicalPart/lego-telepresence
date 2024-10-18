import { LTPGlobal } from "@/interfaces/global"

declare const global: LTPGlobal;

export default async function Home() {
    return <textarea>{JSON.stringify(global.connections,null,2)}</textarea>
}