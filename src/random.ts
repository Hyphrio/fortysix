import { randomBetween, randomIntegerBetween, randomSeeded } from "@std/random";
import Decimal from "decimal.js";
function random45(): number {
    const seed = new Uint32Array(2)
    crypto.getRandomValues(seed)

    const prng = randomSeeded(new DataView(seed.buffer).getBigUint64(0));

    const rand0 = randomBetween(0, 90.001, { prng });

    if (rand0 >= 90.000) {
        return 90.000
    }

    let rand1 = new Decimal(Math.floor(rand0 * 100) / 100);
    const rand2 = randomIntegerBetween(0, 1, { prng });
    console.log(rand2)

    if (rand2 === 1) {
        rand1 = rand1.add(0.005)
    };

    return rand1.toNumber()
}

export {
    random45
}