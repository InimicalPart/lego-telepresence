import { AbsoluteMotor } from "./absolutemotor.js";
import * as Consts from "../consts.js";
export class TechnicLargeAngularMotor extends AbsoluteMotor {
    constructor(hub, portId, modeMap = {}, type = Consts.DeviceType.TECHNIC_LARGE_ANGULAR_MOTOR) {
        super(hub, portId, {}, type);
    }
}
