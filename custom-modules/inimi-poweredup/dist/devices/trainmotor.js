import { BasicMotor } from "./basicmotor.js";
import * as Consts from "../consts.js";
export class TrainMotor extends BasicMotor {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.TRAIN_MOTOR);
    }
}
