class Utils {

    /** Maps one value from one range of values to a target range of values.
     */
    static map(value, sourceMin, sourceMax, targetMin, targetMax) {
        return (value - sourceMin) * (targetMax - targetMin) / (sourceMax - sourceMin) + targetMin;
    }

    /** Performs basic division, returning 0 if the denominator is 0.
     */
    static safeDivide(numerator, denominator) {
        if (denominator === 0) {
            return 0;
        } else {
            return numerator / denominator;
        }
    }

}

module.exports = Utils;