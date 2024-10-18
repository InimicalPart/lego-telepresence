import * as Consts from "./consts.js";
export class Color {
    _color;
    _brightness = 100;
    constructor(color, brightness) {
        this._color = color;
        this._brightness = brightness || 100;
    }
    toValue() {
        if (this._color === Consts.Color.NONE) {
            return this._color;
        }
        return this._color + (Math.round(this._brightness / 10) << 4);
    }
}
