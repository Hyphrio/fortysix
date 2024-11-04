import Decimal from "decimal.js";

function calculateDifference(x: number): number {
    if (x > 45) {
        return new Decimal(x).minus(45).toNumber()
    } else {
        return new Decimal(45).minus(x).toNumber()
    }
}

export { calculateDifference }