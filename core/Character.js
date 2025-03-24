const Constants = require('../utils/Constants');
const RNG = require('../utils/RNG');

class Character {
    constructor(playerNumber, name, baseStats, actions) {
        this.playerNumber = playerNumber; // Track which player this character belongs to
        this.name = name;

        // Apply fuzziness to stats
        const stats = {};
        for (const stat in baseStats) {
            let value = baseStats[stat];
            let fuzziness = Math.floor(RNG.next() * 21) - 10; // Random number between -10 and +10
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

    heal(amount) {
        this.stats.currentHP = Math.min(this.stats.HP, this.stats.currentHP + amount);
    }
}

module.exports = Character;