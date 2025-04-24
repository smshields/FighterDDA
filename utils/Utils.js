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

    static round(number, decimalPlaces){
        if(decimalPlaces <= 0){
            return Math.round(number);
        } else {
            return Math.round((number * Math.pow(10, decimalPlaces)))/Math.pow(10, decimalPlaces)
        }
    }

    //TODO: Refactor parabolic scaling here to make it so other curves can be plugged in.
    static mapRawDamageToDamage(rawDamage, scalar){
        let normalized = this.map(Math.abs(rawDamage), Constants.MIN_POSSIBLE_RAW_DAMAGE, Constants.MAX_POSSIBLE_RAW_DAMAGE, 0, 1);
        let normalizedCurved = Math.pow(normalized, 2);
        let damage = this.map(normalizedCurved, 0, 1, Constants.MIN_HP, Constants.MAX_HP) * scalar;
        return damage;
    }

    static mapDamageToRawDamage(damage, scalar){
        let normalized = this.map(Math.abs(damage/scalar), Constants.MIN_HP, Constants.MAX_HP, 0, 1);
        let normalizedUnCurved = Math.pow(normalized, 1/2);
        let rawDamage = this.map(normalizedUnCurved, 0, 1, Constants.MIN_POSSIBLE_RAW_DAMAGE, Constants.MAX_POSSIBLE_RAW_DAMAGE);
        return rawDamage;
    }

}

module.exports = Utils;