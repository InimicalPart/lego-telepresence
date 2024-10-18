import { BasicMotor } from "./basicmotor.js";
import * as Consts from "../consts.js";
export class SimpleMediumLinearMotor extends BasicMotor {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.SIMPLE_MEDIUM_LINEAR_MOTOR);
    }
}
