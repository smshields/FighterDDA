const Constants = require('../utils/Constants');
const RNG = require('../utils/RNG');
const GameState = require('./GameState');
const Logger = require('../logging/Logger');
const Utils = require('../utils/Utils');

class Character {
    constructor(playerNumber, name, baseStats, actions) {
        this.playerNumber = playerNumber; // Track which player this character belongs to
        this.name = name;
        this.gameState = {};
        this.logger = new Logger();

        // Apply fuzziness to stats
        const stats = {};
        for (const stat in baseStats) {
            let value = baseStats[stat];
            let fuzziness = Math.floor(RNG.next() * 41) - 10; // Random number between -10 and +10
            value -= fuzziness;
            value = Math.max(10, Math.min(100, value)); // Clamp between 10 and 100
            stats[stat] = value;
        }
        this.stats = {...stats,
            currentHP: stats.HP
        };
        this.actions = actions;
        this.actionBar = 0;
        this.defenseBoosted = false; // Flag for defense boost
        this.baseStats = {...stats
        }; // Store the base stats with fuzziness applied

    }

    isAlive() {
        return this.stats.currentHP > 0;
    }

    addActionPoints() {
        this.actionBar += this.stats.Speed * Constants.SPEED_SCALAR;
    }

    resetActionBar() {
        this.actionBar = 0;
    }

    resetDefense() {
        if (this.defenseBoosted) {
            this.stats.Defense = this.baseStats.Defense;
            this.stats.MagicDefense = this.baseStats.MagicDefense;
            this.defenseBoosted = false;
        }
    }

    applyDefenseBoost() {
        this.stats.Defense *= Constants.DEFENSE_SCALAR;
        this.stats.MagicDefense *= Constants.DEFENSE_SCALAR;
        this.defenseBoosted = true;
    }

    takeDamage(damage) {
        this.stats.currentHP = Math.max(0, this.stats.currentHP - damage);
    }

    dealAttackDamage(target, scalar) {
        //Determine minimum possible attack: stat - (stat * (1-luck/100)), add random factor
        let minAttack = (this.stats.Attack - (this.stats.Attack * (1 - this.stats.Luck / 100)));
        //randomly pick (based off of game seed) a value between minimum possible damage and base stat
        let attackingStat = minAttack + ((this.stats.Attack - minAttack) * RNG.next());
        //Determine minimum possible defense: stat - (stat * (1-luck/100)), add random factor
        let minDefense = (target.stats.Defense - (target.stats.Defense * (1 - target.stats.Luck / 100)));
        //randomly pick (based off of game seed) a value between minimum possible damage and base stat
        let defendingStat = minDefense + ((target.stats.Defense - minDefense) * RNG.next());
        // Calculate raw damage, clamp, and map to the 1-65 range
        let rawDamage = (attackingStat - defendingStat);
        //min val - -90, if atk = 10 and def = 100; max val - 90, if atk = 100 and def = 10, clamp between 0-1
        let normalizedDamage = Utils.map(rawDamage, Constants.MIN_POSSIBLE_RAW_DAMAGE, Constants.MAX_POSSIBLE_RAW_DAMAGE, 0, 1);
        //curve damage so it follows a quadratic (lower values should have much less damage)
        let curvedDamage = Math.pow(normalizedDamage, 2);
        //map back onto HP range, multiply by game scalar.
        let damage = (Utils.map(curvedDamage, 0, 1, Constants.MIN_HP, Constants.MAX_HP)) * scalar;
        damage = Utils.round(damage, 2);
        //assign damage to target.
        target.takeDamage(damage);

        //TODO: Damage recieved tracking
        this.gameState.addTotalDamageOut(damage);
        if (this.playerNumber === 1) {
            this.gameState.addPlayer1DamageOut(this, damage);
            this.gameState.addPlayer2DamageIn(target, damage);
        } else {
            this.gameState.addPlayer2DamageOut(this, damage);
            this.gameState.addPlayer1DamageIn(target, damage);
        }

        return damage;
    }

    dealMagicAttackDamage(target, scalar) {
        //Determine minimum possible attack: stat - (stat * (1-luck/100)), add random factor
        let minAttack = (this.stats.MagicAttack - (this.stats.MagicAttack * (1 - this.stats.Luck / 100)));
        //randomly pick (based off of game seed) a value between minimum possible damage and base stat
        let attackingStat = minAttack + ((this.stats.MagicAttack - minAttack) * RNG.next());
        //Determine minimum possible defense: stat - (stat * (1-luck/100)), add random factor
        let minDefense = (target.stats.MagicDefense - (target.stats.MagicDefense * (1 - target.stats.Luck / 100)));
        //randomly pick (based off of game seed) a value between minimum possible damage and base stat
        let defendingStat = minDefense + ((target.stats.MagicDefense - minDefense) * RNG.next());
        // get raw damage
        let rawDamage = (attackingStat - defendingStat);
        //min val - -90, if atk = 10 and def = 100; max val - 90, if atk = 100 and def = 10, clamp between 0-1
        let normalizedDamage = Utils.map(rawDamage, Constants.MIN_POSSIBLE_RAW_DAMAGE, Constants.MAX_POSSIBLE_RAW_DAMAGE, 0, 1);
        //curve damage so it follows a quadratic (lower values should have much less damage)
        let curvedDamage = Math.pow(normalizedDamage, 2);
        //map back onto HP range, multiply by game scalar.
        let damage = (Utils.map(curvedDamage, 0, 1, Constants.MIN_HP, Constants.MAX_HP)) * scalar;
        damage = Utils.round(damage, 2);
        //assign damage to target.
        target.takeDamage(Math.floor(damage));

        //update game state
        this.gameState.addTotalDamageOut(damage);
        if (this.playerNumber === 1) {
            this.gameState.addPlayer1DamageOut(this, damage);
            this.gameState.addPlayer2DamageIn(target, damage);
        } else {
            this.gameState.addPlayer2DamageOut(this, damage);
            this.gameState.addPlayer1DamageIn(target, damage);
        }
        return damage;
    }

    performHeal(target, scalar) {

        //Determine average defense
        let avgDef = (this.stats.MagicDefense + this.stats.Defense) / 2;
        //Calculate minimum possible heal based on luck, random factor
        let minHeal = (avgDef * (this.stats.Luck / 100) * (target.stats.Luck / 100));
        //randomly pick (based off of game seed) a value between minimum possible heal and average defense, tune against scalar, consider target's luck
        let rawHeal = Utils.round((minHeal + ((avgDef - minHeal) * RNG.next())) * scalar, 2);
        let heal = Math.min(target.getMaxPossibleHP() - target.stats.currentHP, rawHeal);
        target.stats.currentHP += heal;
        return heal;
    }

    getMaxPossibleHP() {
        switch (this.name) {
            case Constants.WARRIOR_NAME:
                return Constants.WARRIOR_HP_MAX;
            case Constants.MAGE_NAME:
                return Constants.MAGE_HP_MAX;
            case Constants.PRIEST_NAME:
                return Constants.PRIEST_HP_MAX;
            case Constants.ROGUE_NAME:
                return Constants.ROGUE_HP_MAX;
            default:
                this.logger.logError(`Invalid charater max HP fetch attempt: ${this.name}`);
                return;
        }
    }
}

module.exports = Character;