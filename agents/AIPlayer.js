const Utils = require('../utils/Utils');
const RNG = require('../utils/RNG');

class AIPlayer {
    constructor(playerNumber, characters, mode = 'optimal', lowHealthThreshold = 0.3) {
        this.playerNumber = playerNumber;
        this.characters = characters;
        this.lowHealthThreshold = lowHealthThreshold; // 30% HP or less is considered low health
        this.mode = mode; // 'optimal', 'suboptimal', or 'random'
    }

    chooseAction(character, opponents) {
        switch (this.mode) {
            case 'optimal':
                return this.chooseOptimalAction(character, opponents);
            case 'suboptimal':
                return this.chooseSuboptimalAction(character, opponents);
            case 'random':
                return this.chooseRandomAction(character);
            default:
                console.warn(`Invalid AI mode: ${this.mode}. Defaulting to random.`);
                return this.chooseRandomAction(character);
        }
    }

    chooseOptimalAction(character, opponents) {
        const actionValues = {};

        for (const action of character.actions) {
            actionValues[action.type] = this.evaluateAction(character, action, opponents, this.characters, character);
        }

        let totalValue = 0;
        for (const action of character.actions) {
            totalValue += actionValues[action.type];
        }

        //Debug: check values for decision making
        for (const action of character.actions) {
            console.log("CHARACTER PLAYER: " + character.playerNumber);
            console.log("CHARACTER NAME: " + character.name);
            console.log("ACTION TYPE: " + action.type);
            console.log("EVALUATION SCORE: " + actionValues[action.type]);
        }

        let randomNumber = RNG.next() * totalValue;
        let cumulativeValue = 0;

        for (const action of character.actions) {
            cumulativeValue += actionValues[action.type];
            if (randomNumber <= cumulativeValue) {
                return action;
            }
        }

        const randomIndex = Math.floor(RNG.next() * character.actions.length);
        let bestAction = character.actions[randomIndex];
        return bestAction;
    }

    chooseSuboptimalAction(character, opponents) {
        const actionValues = {};
        let totalValue = 0;

        for (const action of character.actions) {
            actionValues[action.type] = this.evaluateAction(character, action, opponents, this.characters, character);
        }

        // Invert the action values to prioritize suboptimal actions. Every value is guaranteed to be between 0-1
        const invertedActionValues = {};
        let totalInvertedValue = 0;
        for (const action of character.actions) {
            invertedActionValues[action.type] = 1 - actionValues[action.type]; // Invert values
            totalInvertedValue += invertedActionValues[action.type];
        }

        let randomNumber = RNG.next() * totalInvertedValue;
        let cumulativeValue = 0;

        for (const action of character.actions) {
            cumulativeValue += invertedActionValues[action.type];
            if (randomNumber <= cumulativeValue) {
                return action;
            }
        }

        // Should not reach here, but return a random action as a fallback
        const randomIndex = Math.floor(RNG.next() * character.actions.length);
        return character.actions[randomIndex];
    }

    chooseRandomAction(character) {
        const randomIndex = Math.floor(RNG.next() * character.actions.length);
        return character.actions[randomIndex];
    }

    evaluateAction(character, action, opponents, allies, actingCharacter) {
        let value = 0;
        let target = this.chooseTarget(action, actingCharacter, opponents, allies);

        let minClamp = 0;
        let maxClamp = 0;
        //    map(value, sourceMin, sourceMax, targetMin, targetMax) {
        switch (action.type) {
            case 'attack': {
                //Value attacking weakest opponent
                if (target) {
                    value = (character.stats.Attack - target.stats.Defense) * Constants.SINGLE_TARGET_SCALAR;
                    minClamp = -90;
                    maxClamp = 90;
                    value = Utils.map(value, minClamp, maxClamp, 0, 1);
                }
                break;
            }
            case 'multi_attack': {
                //Value multiattack based on average defense - we use single scalar because we're working with an average 
                const aliveOpponents = opponents.filter(c => c.isAlive());
                let totalDamage = 0;
                for (let target of aliveOpponents) {
                    totalDamage += (character.stats.Attack - target.stats.Defense) * Constants.MULTI_TARGET_SCALAR;
                }
                console.log("MULTI ATTACK TOTAL DAMAGE: " + totalDamage);

                minClamp = -90;
                maxClamp = 90;
                value = Utils.map(totalDamage, minClamp, maxClamp, 0, 1);
                break;
            }
            case 'magic_attack': {
                //Value attacking weakest opponent
                if (target) {
                    value = (character.stats.MagicAttack - target.stats.MagicDefense) * Constants.SINGLE_TARGET_SCALAR;
                    minClamp = -90;
                    maxClamp = 90;
                    value = Utils.map(value, minClamp, maxClamp, 0, 1);
                }
                break;
            }
            case 'multi_magic_attack':{
                //Value multiattack based on average magic defense - we use single scalar because we're working with an average
                const aliveMagicOpponents = opponents.filter(c => c.isAlive());
                let totalDamage = 0;
                for (let target of aliveMagicOpponents) {
                    totalDamage += (character.stats.MagicAttack - target.stats.MagicDefense) * Constants.MULTI_TARGET_SCALAR;
                }
                console.log("MULTI MAGIC ATTACK TOTAL DAMAGE: " + totalDamage);

                minClamp = -90;
                maxClamp = 90;
                value = Utils.map(totalDamage, minClamp, maxClamp, 0, 1);
                break;
            }
            case 'heal': {
                //Value healing weakest ally
                if (target) {
                    minClamp = 1;
                    maxClamp = target.stats.HP;
                    value = Utils.map(target.stats.currentHP, minClamp, maxClamp, 0, 1);
                    value = 1 - value;
                    console.log("HEALING CALCULATION - MAX HP: " + target.stats.HP + ", CURRENT HP: " + target.stats.currentHP);
                }
                break;
            }
            case 'multi_heal': {
                //Value based on low health across team
                const aliveAllies = allies.filter(c => c.isAlive());
                let totalMaxHealth = 0;
                for (const ally of aliveAllies) {
                    totalMaxHealth += ally.stats.HP;
                }
                minClamp = 1;
                maxClamp = totalMaxHealth;

                let totalCurrentHealth = aliveAllies.length > 0 ? aliveAllies.reduce((sum, char) => sum + (char.stats.currentHP), 0) : 0;

                value = Utils.map(totalCurrentHealth, minClamp, maxClamp, 0, 1);
                value = 1 - value;
                break;
            }
            case 'defend': {
                // Value defend based on missing health, but keep it in a reasonable range
                const healthRatio = 1 - (character.stats.currentHP / character.stats.HP);
                value = (healthRatio ** 2) / 1.25;
                break;
            }
        }
        return value;
    }

    findWeakestTarget(targets, stat) {
        let weakest = null;
        let lowestStat = Infinity;

        for (const target of targets) {
            if (target.isAlive() && target.stats[stat] < lowestStat) {
                weakest = target;
                lowestStat = target.stats[stat];
            }
        }
        return weakest;
    }

    chooseTarget(action, character, opponents, allies) {
        switch (action.type) {
            case 'attack':
                return this.findWeakestTarget(opponents, 'Defense');
            case 'magic_attack':
                return this.findWeakestTarget(opponents, 'MagicDefense');
            case 'heal':
                return this.findWeakestTarget(allies, 'currentHP'); //Heal weakest ally or self
            default:
                return null; // No target needed for other actions
        }
    }
}

module.exports = AIPlayer;