import PoweredUP from "node-poweredup";
import {GlobalKeyboardListener} from "node-global-key-listener";

const poweredUP = new PoweredUP.PoweredUP();
const v = new GlobalKeyboardListener();


poweredUP.on("discover", async (hub: PoweredUP.Hub) => { // Wait to discover a Hub
    console.log(`Discovered ${hub.name}!`);

    if (hub.name == "Technic Hub") {
        await hub.connect(); // Connect to the Hub
        console.log("Connected");

        console.log("Setting up motors...");
        console.log("Checking motor A...")
        const motorA = await hub.waitForDeviceAtPort("A") as PoweredUP.TachoMotor;
        console.log("Checking motor B...")
        const motorB = await hub.waitForDeviceAtPort("B") as PoweredUP.TachoMotor;
        console.log("Checking motor D...")
        const motorD = await hub.waitForDeviceAtPort("D") as PoweredUP.TachoMotor;



        console.log(hub.batteryLevel);

        //Log every key that's pressed.
        v.addListener(function (e, down) {

            if (e.name == "LEFT ARROW") {
                if (e.state == "DOWN") {
                    console.log(
                        "LEFT ARROW pressed"
                    )
                    motorD.setPower(-50);
                    console.log(
                        "LEFT ARROW action done"
                    )
                } else {
                    motorD.setPower(0);
                    motorD.brake();
                }
            } else if (e.name == "RIGHT ARROW") {
                if (e.state == "DOWN") {
                    motorD.setPower(50);
                } else {
                    motorD.setPower(0);
                    motorD.brake();
                }
            } else if (e.name == "UP ARROW") {
                if (e.state == "DOWN") {
                    motorA.setPower(100);
                    motorB.setPower(100);
                } else {
                    motorA.setPower(0);
                    motorB.setPower(0);
                    motorA.brake();
                    motorB.brake();
                }
            } else if (e.name == "DOWN ARROW") {
                if (e.state == "DOWN") {
                    motorA.setPower(-100);
                    motorB.setPower(-100);
                } else {
                    motorA.setPower(0);
                    motorB.setPower(0);
                    motorA.brake();
                    motorB.brake();
                }
            } else if (e.name == "HOME") {
                if (e.state == "DOWN") {
                    motorD.setPower(-50);
                } else {
                    motorB.brake();
                }
            }

        });
        
    }
});

poweredUP.scan(); // Start scanning for Hubs
console.log("Scanning for Hubs...");