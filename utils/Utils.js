/** 
 * TODO - TESTING:
 * safeDivide, getRandomElement, round
 * 
 * TODO - DEPRECATE/REWRITE:
 * mapRawDamageToDamage, mapDamageToRawDamage
 */
const Constants = require('./Constants');

/** A static classed containing generic helper functions. */
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

    /** Returns a random element of an array.
     * @param {Object[]} array - the array to find a random element from
     * @returns {Object} a random element from the array
     */
    static getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /** Finds slope between two points
     * @param {double} x1 - the first point's x value.
     * @param {double} y1 - the first point's y value.
     * @param {double} x2 - the second point's x value.
     * @param {double} y2 - the second point's y value.
     * @returns {double} The slope between the two points.
     */
    static getSlopeFromPoints(x1, y1, x2, y2){
        let rise = y2 - y1;
        let run = x2 - x1;
        return this.safeDivide(rise, run);
    }

    /** Finds yIntercept based on a slope and point on the line.
     * @param {double} x - the x of point.
     * @param {double} y - the y of point.
     * @param {double} slope - the slope of the line.
     * @returns {double} The y intercept of the line.
     * */
    static getYIntercept(x, y, slope){
        return (slope * x) - y;
    }

    static round(number, decimalPlaces) {
        if (decimalPlaces <= 0) {
            return Math.round(number);
        } else {
            return Math.round((number * Math.pow(10, decimalPlaces))) / Math.pow(10, decimalPlaces)
        }
    }

    /**Calculates the maximum possible damage based on an actor's attack and target's defense.
     * @param {Character} actor - The attacking character.  
     * @param {Character} target - the defending character.
     * @param {double} scalar - modifier for the attack (single, multi - see utils/Constants.js).
     * @returns {double} maximum possible raw damage.
     * */
    static mapAttackStatToDamage(actor, target, scalar) {
        let rawDamage = actor.stats.Attack - target.stats.Defense;
        rawDamage = this.map(rawDamage, Constants.MIN_POSSIBLE_RAW_DAMAGE, Constants.MAX_POSSIBLE_RAW_DAMAGE, 0, 1);
        rawDamage = Math.pow(rawDamage, 2);
        rawDamage = this.map(rawDamage, 0, 1, Constants.MIN_POSSIBLE_DAMAGE, Constants.MAX_POSSIBLE_DAMAGE);
        let damage = this.round(rawDamage * scalar, 2);
        return damage;
    }

    /**Calculates the maximum possible damage based on an actor's magic attack and target's magic defense.
     * @param {Character} actor - The magic attacking character.  
     * @param {Character} target - the magic defending character.
     * @param {double} scalar - modifier for the attack (single, multi - see utils/Constants.js).
     * @returns {double} maximum possible raw damage.
     * */
    static mapMagicAttackStatToDamage(actor, target, scalar) {
        let rawDamage = actor.stats.MagicAttack - target.stats.MagicDefense;
        rawDamage = this.map(rawDamage, Constants.MIN_POSSIBLE_RAW_DAMAGE, Constants.MAX_POSSIBLE_RAW_DAMAGE, 0, 1);
        rawDamage = Math.pow(rawDamage, 2);
        rawDamage = this.map(rawDamage, 0, 1, Constants.MIN_POSSIBLE_DAMAGE, Constants.MAX_POSSIBLE_DAMAGE);
        let damage = this.round(rawDamage * scalar, 2);
        return damage;
    }

    /**
     * Calculates the maximum possible heal based on an actor's defense and magic defense
     * @param {Character} actor - the character performing the heal.
     * @param {double} scalar - modifier for the heal (single, multi - see utils/Constants.js
     * @returns {double} maximum possible raw heal.
     * */
    static mapDefenseStatsToHeal(actor, scalar) {
        return (actor.stats.Defense + actor.stats.MagicDefense) / 2;
    }

    //TODO: Refactor parabolic scaling here to make it so other curves can be plugged in.
    static mapRawDamageToDamage(rawDamage, scalar) {
        let normalized = this.map(Math.abs(rawDamage), Constants.MIN_POSSIBLE_RAW_DAMAGE, Constants.MAX_POSSIBLE_RAW_DAMAGE, 0, 1);
        let normalizedCurved = Math.pow(normalized, 2);
        let damage = this.map(normalizedCurved, 0, 1, Constants.MIN_HP, Constants.MAX_HP) * scalar;
        return damage;
    }

    static mapDamageToRawDamage(damage, scalar) {
        let normalized = this.map(Math.abs(damage / scalar), Constants.MIN_HP, Constants.MAX_HP, 0, 1);
        let normalizedUnCurved = Math.pow(normalized, 1 / 2);
        let rawDamage = this.map(normalizedUnCurved, 0, 1, Constants.MIN_POSSIBLE_RAW_DAMAGE, Constants.MAX_POSSIBLE_RAW_DAMAGE);
        return rawDamage;
    }

    /**
     * Clamps a value between a minimum and maximum value.
     * @param {double} value - value to be clamped.
     * @param {double} min - minimum possible value.
     * @param {double} max - maximum possible value.
     * @returns {double} the clamped number.
     * */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

}

module.exports = Utils;