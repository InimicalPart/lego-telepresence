import { AbsoluteMotor } from "./absolutemotor.js";
import * as Consts from "../consts.js";
export class TechnicMediumAngularMotor extends AbsoluteMotor {
    constructor(hub, portId, modeMap = {}, type = Consts.DeviceType.TECHNIC_MEDIUM_ANGULAR_MOTOR) {
        super(hub, portId, {}, type);
    }
}
