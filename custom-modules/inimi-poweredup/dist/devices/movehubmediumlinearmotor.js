import { TachoMotor } from "./tachomotor.js";
import * as Consts from "../consts.js";
export class MoveHubMediumLinearMotor extends TachoMotor {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.MOVE_HUB_MEDIUM_LINEAR_MOTOR);
    }
}
