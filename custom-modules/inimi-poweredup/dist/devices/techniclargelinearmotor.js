import { AbsoluteMotor } from "./absolutemotor.js";
import * as Consts from "../consts.js";
export class TechnicLargeLinearMotor extends AbsoluteMotor {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.TECHNIC_LARGE_LINEAR_MOTOR);
    }
}
