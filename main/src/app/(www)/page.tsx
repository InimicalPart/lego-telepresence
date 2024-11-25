import { LTPGlobal } from "@/interfaces/global"

import "@/styles/online-dot.css"

import { JWTCheck } from "@/utils/auth/credCheck"
import CarCards from "@/components/carCards"
declare const global: LTPGlobal

export const dynamic = 'force-dynamic'

export default async function Home() {
    //! Check if the user is logged in, if not, redirect to login page
    const res = await JWTCheck();
    if (res.success !== true) return res;

    const cars = global.connections?.filter(conn=>!!conn.car).map(car=>({
        id: car.id,
        car: car.car,
        type: car.type,
        ready: car.ready,
        system: car.system
    })) ?? []
    const cams = global.connections?.filter(conn=>!!conn.cam).map(cam=>({
        id: cam.id,
        cam: cam.cam,
        type: cam.type,
        system: cam.system
    })) ?? []

    return <><CarCards cams={cams} cars={cars} /></>

}