import { AbsoluteMotor } from "./absolutemotor.js";
import * as Consts from "../consts.js";
export class TechnicSmallAngularMotor extends AbsoluteMotor {
    constructor(hub, portId, modeMap = {}, type = Consts.DeviceType.TECHNIC_SMALL_ANGULAR_MOTOR) {
        super(hub, portId, {}, type);
    }
}
