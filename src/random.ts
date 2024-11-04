import { randomBetween, randomSeeded } from "@std/random";
function random45(): number {
    const seed = new Uint32Array(2)
    crypto.getRandomValues(seed)

    const prng = randomSeeded(new DataView(seed.buffer).getBigUint64(0));

    return Math.floor(randomBetween(0, 90, { prng }) * 1000) / 1000
}

export {
    random45
}