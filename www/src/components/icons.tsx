export const Car = ({
    size = 24,
    color = "black",
}: ({size:number, color?: string})) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} fill={color} height={size} viewBox="0 0 512 512"><path d="M135.2 117.4L109.1 192l293.8 0-26.1-74.6C372.3 104.6 360.2 96 346.6 96L165.4 96c-13.6 0-25.7 8.6-30.2 21.4zM39.6 196.8L74.8 96.3C88.3 57.8 124.6 32 165.4 32l181.2 0c40.8 0 77.1 25.8 90.6 64.3l35.2 100.5c23.2 9.6 39.6 32.5 39.6 59.2l0 144 0 48c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-48L96 400l0 48c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-48L0 256c0-26.7 16.4-49.6 39.6-59.2zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm288 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"/></svg>
    )    
}


export const Camera = ({
    size = 24,
    color = "black"
}: ({size:number, color?: string})) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} fill={color} height={size} viewBox="0 0 512 512"><path d="M149.1 64.8L138.7 96 64 96C28.7 96 0 124.7 0 160L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64l-74.7 0L362.9 64.8C356.4 45.2 338.1 32 317.4 32L194.6 32c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg>
    )    
}

export const Computer = ({
    size = 24,
    color = "black"
}: ({size:number, color?: string})) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill={color} height={size} viewBox="0 0 640 512"><path d="M384 96l0 224L64 320 64 96l320 0zM64 32C28.7 32 0 60.7 0 96L0 320c0 35.3 28.7 64 64 64l117.3 0-10.7 32L96 416c-17.7 0-32 14.3-32 32s14.3 32 32 32l256 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-74.7 0-10.7-32L384 384c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L64 32zm464 0c-26.5 0-48 21.5-48 48l0 352c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48l-64 0zm16 64l32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm-16 80c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16zm32 160a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>
    )
}

const BatteryFull = ({
    size = 24,
    color = "black"
}: ({size:number, color?: string})) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} fill={color} height={size} viewBox="0 0 576 512"><path d="M464 160c8.8 0 16 7.2 16 16l0 160c0 8.8-7.2 16-16 16L80 352c-8.8 0-16-7.2-16-16l0-160c0-8.8 7.2-16 16-16l384 0zM80 96C35.8 96 0 131.8 0 176L0 336c0 44.2 35.8 80 80 80l384 0c44.2 0 80-35.8 80-80l0-16c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l0-16c0-44.2-35.8-80-80-80L80 96zm368 96L96 192l0 128 352 0 0-128z"/></svg>
    )
}

const BatteryThreeQuarters = ({
    size = 24,
    color = "black"
}: ({size:number, color?: string})) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} fill={color} height={size} viewBox="0 0 576 512"><path d="M464 160c8.8 0 16 7.2 16 16l0 160c0 8.8-7.2 16-16 16L80 352c-8.8 0-16-7.2-16-16l0-160c0-8.8 7.2-16 16-16l384 0zM80 96C35.8 96 0 131.8 0 176L0 336c0 44.2 35.8 80 80 80l384 0c44.2 0 80-35.8 80-80l0-16c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l0-16c0-44.2-35.8-80-80-80L80 96zm272 96L96 192l0 128 256 0 0-128z"/></svg>
    )
}

const BatteryHalf = ({
    size = 24,
    color = "black"
}: ({size:number, color?: string})) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} fill={color} height={size} viewBox="0 0 576 512"><path d="M464 160c8.8 0 16 7.2 16 16l0 160c0 8.8-7.2 16-16 16L80 352c-8.8 0-16-7.2-16-16l0-160c0-8.8 7.2-16 16-16l384 0zM80 96C35.8 96 0 131.8 0 176L0 336c0 44.2 35.8 80 80 80l384 0c44.2 0 80-35.8 80-80l0-16c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l0-16c0-44.2-35.8-80-80-80L80 96zm208 96L96 192l0 128 192 0 0-128z"/></svg>
    )
}

const BatteryQuarter = ({
    size = 24,
    color = "black"
}: ({size:number, color?: string})) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} fill={color} height={size} viewBox="0 0 576 512"><path d="M464 160c8.8 0 16 7.2 16 16l0 160c0 8.8-7.2 16-16 16L80 352c-8.8 0-16-7.2-16-16l0-160c0-8.8 7.2-16 16-16l384 0zM80 96C35.8 96 0 131.8 0 176L0 336c0 44.2 35.8 80 80 80l384 0c44.2 0 80-35.8 80-80l0-16c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l0-16c0-44.2-35.8-80-80-80L80 96zm112 96l-96 0 0 128 96 0 0-128z"/></svg>
    )
}

const BatteryEmpty = ({
    size = 24,
    color = "black"
}: ({size:number, color?: string})) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} fill={color} height={size} viewBox="0 0 576 512"><path d="M80 160c-8.8 0-16 7.2-16 16l0 160c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-160c0-8.8-7.2-16-16-16L80 160zM0 176c0-44.2 35.8-80 80-80l384 0c44.2 0 80 35.8 80 80l0 16c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l0 16c0 44.2-35.8 80-80 80L80 416c-44.2 0-80-35.8-80-80L0 176z"/></svg>
    )
}

export const X = ({
    size = 24,
    color = "black"
}: ({size:number, color?: string})) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} fill={color} height={size} viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
    )
}

export const QuestionMark = ({
    size = 24,
    color = "black"
}: ({size:number, color?: string})) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} fill={color} height={size} viewBox="0 0 320 512"><path d="M80 160c0-35.3 28.7-64 64-64l32 0c35.3 0 64 28.7 64 64l0 3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74l0 1.4c0 17.7 14.3 32 32 32s32-14.3 32-32l0-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7l0-3.6c0-70.7-57.3-128-128-128l-32 0C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"/></svg>
    )
}



export const Battery = {
    FULL: BatteryFull,
    THREE_QUARTERS: BatteryThreeQuarters,
    HALF: BatteryHalf,
    QUARTER: BatteryQuarter,
    EMPTY: BatteryEmpty
}


