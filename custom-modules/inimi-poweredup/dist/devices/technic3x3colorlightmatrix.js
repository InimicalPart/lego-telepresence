import { Color } from "../color.js";
import { Device } from "./device.js";
import * as Consts from "../consts.js";
export class Technic3x3ColorLightMatrix extends Device {
    constructor(hub, portId) {
        super(hub, portId, {}, Consts.DeviceType.TECHNIC_3X3_COLOR_LIGHT_MATRIX);
    }
    setMatrix(colors) {
        return new Promise((resolve) => {
            this.subscribe(Mode.PIX_0);
            const colorArray = new Array(9);
            for (let i = 0; i < colorArray.length; i++) {
                if (typeof colors === 'number') {
                    colorArray[i] = colors + (10 << 4);
                }
                if (colors[i] instanceof Color) {
                    colorArray[i] = colors[i].toValue();
                }
                if (colors[i] === Consts.Color.NONE) {
                    colorArray[i] = Consts.Color.NONE;
                }
                if (colors[i] <= 10) {
                    colorArray[i] = colors[i] + (10 << 4);
                }
            }
            this.writeDirect(Mode.PIX_0, Buffer.from(colorArray));
            return resolve();
        });
    }
}
export var Mode;
(function (Mode) {
    Mode[Mode["LEV_0"] = 0] = "LEV_0";
    Mode[Mode["COL_0"] = 1] = "COL_0";
    Mode[Mode["PIX_0"] = 2] = "PIX_0";
    Mode[Mode["TRANS"] = 3] = "TRANS";
})(Mode || (Mode = {}));
