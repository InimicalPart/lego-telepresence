import { AbsoluteMotor } from "./absolutemotor.js";
import * as Consts from "../consts.js";
export class TechnicXLargeLinearMotor extends AbsoluteMotor {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.TECHNIC_XLARGE_LINEAR_MOTOR);
    }
}
