import { TachoMotor } from "./tachomotor.js";
import * as Consts from "../consts.js";
export class MediumLinearMotor extends TachoMotor {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.MEDIUM_LINEAR_MOTOR);
    }
}
