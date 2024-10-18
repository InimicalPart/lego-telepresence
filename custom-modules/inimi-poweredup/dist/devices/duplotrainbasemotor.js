import { BasicMotor } from "./basicmotor.js";
import * as Consts from "../consts.js";
export class DuploTrainBaseMotor extends BasicMotor {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.DUPLO_TRAIN_BASE_MOTOR);
    }
}
