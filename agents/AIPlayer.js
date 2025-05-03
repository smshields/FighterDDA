/**
 * TODO: REFACTORING - 
 * - Make action types constants
 * - Make agent behavior types constants 
 * - Consider making a DefensePotential class for consistency
 * - Make object that represents object scores
 * */

const Utils = require('../utils/Utils');
const RNG = require('../utils/RNG');
const AttackDamagePotential = require('./action_potential/AttackDamagePotential');
const MultiAttackDamagePotential = require('./action_potential/MultiAttackDamagePotential');
const MagicAttackDamagePotential = require('./action_potential/MagicAttackDamagePotential');
const MultiMagicAttackDamagePotential = require('./action_potential/MultiMagicAttackDamagePotential');
const HealPotential = require('./action_potential/HealPotential');
const MultiHealPotential = require('./action_potential/MultiHealPotential');
const ActionScore = require('./action_score/ActionScore');

/** Class that contains the Player agent. Can be set to have different performances. Uses a utility algorithm to make decisions.*/
class AIPlayer {
    constructor(playerNumber, characters, mode = 'optimal', actionRandomness = 0) {
        this.playerNumber = playerNumber;
        this.characters = characters;
        this.mode = mode; // 'optimal', 'suboptimal'
        this.actionRandomness = actionRandomness;
    }


    /**
     * NOTE: Need to get allies to make this work properly.
     * 
     * 
     * */
    chooseAction(character, allies, opponents) {
        let actionScores = [];

        for (let action of character.actions) {
            actionScores.push(this.evaluateAction(character, allies, opponents, action.type));
        }

        let totalScore = 0;
        for (let actionScore of actionScores) {
            totalScore += actionScore.score;
        }



    }

    /**
     * Evaluates an action for a given character.
     * @param {Character} actor - the acting character.
     * @param {Character[]} allies - the acting character's team.
     * @param {Character[]} opponents - the acting character's opponent's team.
     * @param {string} actionType - the action to score.
     * @returns {ActionScore} - the action's type and utility score.
     * */
    evaluateAction(actor, allies, opponents, actionType) {
        //filter out dead characters as invalid targets
        let aliveAllies = allies.filter(ally => ally.isAlive());
        let aliveOpponents = opponents.filter(opponent => opponent.isAlive());

        //perform evaluation based on type
        switch (actionType) {
            case Constants.ATTACK_ACTION_TYPE:
                {
                    return this.evaluateAttack(actor, aliveOpponents);
                }
            case Constants.MULTI_ATTACK_ACTION_TYPE:
                {
                    return this.evaluateMultiAttack(actor, aliveOpponents);
                }
            case Constants.MAGIC_ATTACK_ACTION_TYPE:
                {
                    return this.evaluateMagicAttack(actor, aliveOpponents);
                }
            case Constants.MULTI_MAGIC_ATTACK_ACTION_TYPE:
                {
                    return this.evaluateMultiMagicAttack(actor, aliveOpponents);
                }
            case Constants.HEAL_ACTION_TYPE:
                {
                    return this.evaluateHeal(actor, aliveAllies);
                }
            case Constants.MULTI_HEAL_ACTION_TYPE:
                {
                    return this.evaluateMultiHeal(actor, aliveAllies);
                }
            case Constants.DEFEND_ACTION_TYPE:
                {
                    return this.evaluateDefend(actor, aliveAllies);
                }
            default:
                {
                    Logger.logError("AIPlayer - evaluateAction: No valid action type specified!");
                    return 0;
                }
        }

        /**
         * Looks at an array of scores and provides one to execute based on mode, randomness
         * @param {}*/
        selectActionFromScores() {}

        chooseOptimalAction(character, opponents) {
            const actionValues = {};

            for (const action of character.actions) {
                actionValues[action.type] = this.evaluateAction(character, action, opponents, this.characters);
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

        /**
         * Evaluates a character's available actions and scores them by current utility.
         * @*/
        evaluateAction(character, action, opponents, allies) {
            let value = 0;
            let target = this.chooseTarget(action, character, opponents, allies);

            let minClamp = 0;
            let maxClamp = 0;
            //    map(value, sourceMin, sourceMax, targetMin, targetMax) {
            switch (action.type) {
                case 'attack':
                    {
                        //Value attacking weakest opponent
                        if (target) {
                            value = (character.stats.Attack - target.stats.Defense) * Constants.SINGLE_TARGET_SCALAR;
                            minClamp = -90;
                            maxClamp = 90;
                            value = Utils.map(value, minClamp, maxClamp, 0, 1);
                        }
                        break;
                    }
                case 'multi_attack':
                    {
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
                case 'magic_attack':
                    {
                        //Value attacking weakest opponent
                        if (target) {
                            value = (character.stats.MagicAttack - target.stats.MagicDefense) * Constants.SINGLE_TARGET_SCALAR;
                            minClamp = -90;
                            maxClamp = 90;
                            value = Utils.map(value, minClamp, maxClamp, 0, 1);
                        }
                        break;
                    }
                case 'multi_magic_attack':
                    {
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
                case 'heal':
                    {
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
                case 'multi_heal':
                    {
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
                case 'defend':
                    {
                        // Value defend based on missing health, but keep it in a reasonable range
                        const healthRatio = 1 - (character.stats.currentHP / character.stats.HP);
                        value = (healthRatio ** 2) / 1.25;
                        break;
                    }
            }
            return value;
        }

        /**
         * Looks at an acting character and scores the utility of attacking a single opponent.
         * @param {character} actor - the acting character.
         * @param {character[]]} opponents - all characters on the opponent's team.
         * @returns {ActionScore} a score from 0-1 detailing utility of attacking.
         */
        evaluateAttack(actor, opponents) {
            let attackActionScore = new ActionScore(Constants.ATTACK_ACTION_TYPE, -1);

            //Safety checks
            if (!actor) {
                Logger.logError("AIPlayer - evaluateAttack: No attacking character specified!");
                return attackActionScore;
            }

            if (opponents.length <= 0) {
                Logger.logError("AIPlayer - evaluateAttack: No valid targets for attack specified!");
                return attackActionScore;
            }

            //Identify best target - returns a character
            let bestAttackDamagePotential = this.findOptimalAttackTarget(actor, opponents);

            if (!bestAttackDamagePotential) {
                Logger.log("AIPlayer - evaluateAttack: No optimal target for attacking found!");
                return attackActionScore;
            }

            //If it kills, weight very highly. Otherwise, do it proportional to damage potential
            if (bestAttackDamagePotential.killsTarget) {
                attackActionScore.score = 1;
            } else {
                attackActionScore.score = Utils.clamp(bestAttackDamagePotential.damagePotential / bestAttackDamagePotential.target.stats.currentHP, 0, 1);
            }
            return attackActionScore;
        }

        /**
         * Looks at an acting character and scores the utility of attacking multiple opponents.
         * @param {Character} actor - the acting character.
         * @param {Character[]} opponents - all characters on the opponent's team.
         * @returns {ActionScore} a score from 0-1 detailing utility of attacking.
         * */
        evaluateMultiAttack(actor, opponents) {
            let multiAttackActionScore = new ActionScore(Constants.MULTI_ATTACK_ACTION_TYPE, -1);

            //Safety checks
            if (!actor) {
                Logger.logError("AIPlayer - evaluateMultiAttack: No attacking character specified!");
                return multiAttackActionScore;
            }

            if (opponents.length <= 0) {
                Logger.logError("AIPlayer - evaluateMultiAttack: No valid targets for attack specified!");
                return multiAttackActionScore;
            }

            //no need to evaluate for best target, just get total damage potential
            let multiAttackDamagePotential = new MultiAttackDamagePotential(actor, opponents);

            if (multiAttackDamagePotential.numberOfKills > 0) {
                multiAttackActionScore.score = 1;
            } else {
                //TODO: Get access to game state to avoid recalculating here.
                let totalCurrentHP = 0;
                for (let target of opponents) {
                    totalCurrentHP += target.stats.currentHP;
                }
                multiAttackActionScore.score = Utils.clamp(multiAttackDamagePotential.totalDamagePotential / totalCurrentHP, 0, 1);
            }
            return multiAttackActionScore;
        }

        /**
         * Looks at an acting character and scores the utility of magic attacking a single opponent.
         * @param {character} actor - the acting character.
         * @param {character[]]} opponents - all characters on the opponent's team.
         * @returns {ActionScore} a score from 0-1 detailing utility of magic attacking.
         */
        evaluateMagicAttack(actor, opponents) {
            let magicAttackActionScore = new ActionScore(Constants.MAGIC_ATTACK_ACTION_TYPE, -1);
            //Safety checks
            if (!actor) {
                Logger.logError("AIPlayer - evaluateMagicAttack: No magic attacking character specified!");
                return magicAttackActionScore;
            }

            if (opponents.length <= 0) {
                Logger.logError("AIPlayer - evaluateMagicAttack: No valid targets for magic attack specified!");
                return magicAttackActionScore;
            }

            //Identify best target - returns a character
            let bestMagicAttackDamagePotential = this.findOptimalMagicAttackTarget(actor, opponents);

            if (!bestAttackDamagePotential) {
                Logger.logError("AIPlayer - evaluateMagicAttack: No optimal target for magic attacking found!");
                return magicAttackActionScore;
            }

            //If it kills, weight very highly. Otherwise, do it proportional to damage potential
            if (bestMagicAttackDamagePotential.killsTarget) {
                magicAttackActionScore.score = 1;
            } else {
                magicAttackActionScore.score = Utils.clamp(bestMagicAttackDamagePotential.damagePotential / bestMagicAttackDamagePotential.target.stats.currentHP, 0, 1);

            }
            return magicAttackActionScore;
        }

        /**
         * Looks at an acting character and scores the utility of magic attacking multiple opponents.
         * @param {Character} actor - the acting character.
         * @param {Character[]} opponents - all characters on the opponent's team.
         * @returns {ActionScore} a score from 0-1 detailing utility of magic attacking.
         * */
        evaluateMultiMagicAttack(actor, opponents) {
            let multiMagicAttackActionScore = new ActionScore(Constants.MULTI_MAGIC_ATTACK_ACTION_TYPE, -1);
            //Safety checks
            if (!actor) {
                Logger.logError("AIPlayer - evaluateMultiMagicAttack: No magic attacking character specified!");
                return multiMagicAttackActionScore;
            }

            if (opponents.length <= 0) {
                Logger.logError("AIPlayer - evaluateMultiMagicAttack: No valid targets for magic attack specified!");
                return multiMagicAttackActionScore;
            }

            //no need to evaluate for best target, just get total damage potential
            let multiMagicAttackDamagePotential = new MultiMagicAttackDamagePotential(actor, opponents);

            if (multiMagicAttackDamagePotential.numberOfKills > 0) {
                multiMagicAttackActionScore.score = 1;

            } else {
                //TODO: Get access to game state to avoid recalculating here.
                let totalCurrentHP = 0;
                for (let target of opponents) {
                    totalCurrentHP += target.stats.currentHP;
                }
                multiMagicAttackActionScore.score = Utils.clamp(multiMagicAttackDamagePotential.totalDamagePotential / totalCurrentHP, 0, 1);
            }
            return multiMagicAttackActionScore;
        }

        /**
         * Looks at an acting character and scores the utility of healing an ally.
         * @param {Character} actor - the acting character.
         * @param {Character[]} allies - all characters on the acting character's team.
         * @returns {double} a score from 0-1 detailing utility of healing a single target.
         * */
        evaluateHeal(actor, allies) {
            let healActionScore = new ActionScore(Constants.HEAL_ACTION_TYPE, -1);

            if (!actor) {
                Logger.logError("AIPlayer - evaluateHeal: No healing character specified!");
                return healActionScore;
            }

            if (allies.length <= 0) {
                Logger.logError("AIPlayer - evaluateHeal: No valid targets for healing specified!");
                return healActionScore;
            }

            //find lowest health ratio
            let bestHealPotential = this.findOptimalHealTarget(actor, allies);
            //find potential heal
            let healPotential = new HealPotential(actor, bestHealPotential);

            //heal should be prioritized the lower a character's hp ratio is
            let healUrgency = (1 - healPotential.hpRatio) ** 2;
            //disincentivize heals that massively overheal a character
            let overHealPunish = 0;
            if (healPotential.overHeals) {
                overHealPunish = (1 - healPotential.overHealRatio);
            }

            healActionScore.score = Utils.clamp(healUrgency - overHealPunish, 0, 1);
            return healActionScore;
        }

        /**
         * Looks at an acting character and scores the utility of healing multiple allies.
         * @param {Character} actor - the acting character.
         * @param {Character[]} allies - all characters on the actor's team.
         * @returns {double} a score from 0-1 detailing utility of multi healing.
         * */
        evaluateMultiHeal(actor, allies) {
            let multiHealActionScore = new ActionScore(Constants.MULTI_HEAL_ACTION_TYPE, -1);
            //Safety checks
            if (!actor) {
                Logger.logError("AIPlayer - evaluateMultiHeal: No healing character specified!");
                return multiHealActionScore;
            }

            if (allies.length <= 0) {
                Logger.logError("AIPlayer - evaluateMultiHeal: No valid targets for healing specified!");
                return multiHealActionScore;
            }

            //no need to evaluate for best target, just get total damage potential
            let multiHealPotential = new MultiHealPotential(actor, allies);

            //heal should be prioritized the lower a team's hp ratio is
            let healUrgency = (1 - multiHealPotential.hpRatio) ** 2;
            //disincentivize heals that overheal a team
            let overHealPunish = 0;
            if (multiHealPotential.overHeals) {
                overHealPunish = (1 - multiHealPotential.overHealRatio);
            }

            multiHealActionScore.score = Utils.clamp(healUrgency - overHealPunish, 0, 1);
            return multiHealActionScore;
        }

        /**
         * Looks at an acting character and scores the utility of defending.
         * @param {Character} actor - the acting character.
         * @param {Character[]} allies - all characters on the actor's team.
         * @returns {double} a score from 0-1 detailing utility of defending.
         **/
        evaluateDefend(actor, allies) {
            let defendActionScore = new ActionScore(Constants.DEFEND_ACTION_TYPE, -1);

            //Safety checks
            if (!actor) {
                Logger.logError("AIPlayer - evaluateMultiHeal: No healing character specified!");
                return defendActionScore;
            }

            if (allies.length <= 0) {
                Logger.logError("AIPlayer - evaluateMultiHeal: No valid targets for healing specified!");
                return defendActionScore;
            }

            //Check for allies who can heal (none decreases likelihood of defense)
            let healerUnvailable = true;
            for (let ally of allies) {
                for (let action of ally.actions) {
                    if (action.type === 'heal' || action.type === 'multi_heal') {
                        healerUnavailable = false;
                    }
                }
            }

            //Get hpRatio, inverse square to get correct curve
            let hpRatio = actor.getHPRatio();
            let defendUrgency = (1 - hpRatio) ** 2;

            let healerUnavailablePunish = 0;

            if (healerUnvailable) {
                healerUnavailablePunish = defendUrgency / 2;
            }

            defendActionScore.score = Utils.clamp(defendUrgency - healerUnavailablePunish, 0, 1);
            return defendActionScore;
        }

        findOptimalHealTarget(actor, allies) {
            if (!actor) {
                Logger.logError("AIPlayer - findOptimalHealTarget: No healing character specified!");
                return null;
            }

            if (allies.length <= 0) {
                Logger.logError("AIPlayer - findOptimalHealTarget: No valid targets for healing specified!");
                return null;
            }

            let healPotentials = [];

            for (let target of allies) {
                //if target has no HP remaining, ignore
                if (target.stats.currentHP <= 0) {
                    Logger.logError("AIPlayer - findOptimalHealTarget: Target with no HP was checked!");
                } else {
                    //get all damage potentials
                    healPotentials.push(new HealPotential(actor, target));
                }
            }

            if (healPotentials.length <= 0) {
                Logger.logError("AIPlayer - findOptimalHealTarget: No valid healing potentials exist!");
                return null;
            }

            //Otherwise, get lowest HP ratio
            //Sort ascending
            healPotentials.sort((a, b) => {
                return a.hpRatio - b.hpRatio;
            });

            //if we have ties for best targets, we need to pick one randomly
            let bestTargets = [healPotentials.shift()];
            while (healPotentials.length > 0 && bestTargets[bestTargets.length - 1].healPotential == healPotentials[0].healPotential) {
                bestTargets.push(healPotentials.shift());
            }
            return Utils.getRandomElement(bestTargets);
        }

        /**
         * Returns a character from a list that will be optimized for an attack. 
         * If a kill is possible, that character is returned. 
         * If more than one kill is possible, a character is randomly selected.
         * If no kill is possible, the character with the maximum damage possible will be selected.
         * @param {character} actor - the character performing the attack.
         * @param {character[]} targets - the available targets for the attack.
         * @returns {character} Targeted character for attack.
         */
        findOptimalAttackTarget(actor, targets) {
            if (!actor) {
                Logger.logError("AIPlayer - findOptimalAttackTarget: No attacking character specified!");
                return null;
            }

            if (opponents.length <= 0) {
                Logger.logError("AIPlayer - findOptimalAttackTarget: No valid targets for attack specified!");
                return null;
            }

            let damagePotentials = [];

            for (let target of opponents) {
                //if target has no HP remaining, ignore
                if (target.stats.currentHP <= 0) {
                    Logger.logError("AIPlayer - findOptimalAttackTarget: Target with no HP was checked!");
                } else {
                    //get all damage potentials
                    damagePotentials.push(new AttackDamagePotential(actor, target));
                }
            }

            if (damagePotentials.length <= 0) {
                Logger.logError("AIPlayer - findOptimalAttackTarget: No valid damage potentials exist!");
                return null;
            }

            //if we have one or more kills, return one at random
            let targetsKilled = damagePotentials.filter((potential) => potential.killsTarget);
            if (targetsKilled.length > 0) {
                return Utils.getRandomElement(targetsKilled);
            }

            //Otherwise, get highest damage potential
            //Sort descending
            damagePotentials.sort((a, b) => {
                return b.damagePotential - a.damagePotential;
            });

            //if we have ties for best targets, we need to pick one randomly
            let bestTargets = [damagePotentials.shift()];
            while (damagePotentials.length > 0 && bestTargets[bestTargets.length - 1].damagePotential == damagePotentials[0].damagePotential) {
                bestTargets.push(damagePotentials.shift());
            }
            return Utils.getRandomElement(bestTargets);
        }

        /**
         * Returns a character from a list that will be optimized for a magic attack. 
         * If a kill is possible, that character is returned. 
         * If more than one kill is possible, a character is randomly selected.
         * If no kill is possible, the character with the maximum damage possible will be selected.
         * @param {character} actor - the character performing the attack.
         * @param {character[]} targets - the available targets for the attack.
         * @returns {character} Targeted character for attack.
         */
        findOptimalMagicAttackTarget(actor, targets) {
            if (!actor) {
                Logger.logError("AIPlayer - findOptimalMagicAttackTarget: No magic attacking character specified!");
                return null;
            }

            if (opponents.length <= 0) {
                Logger.logError("AIPlayer - findOptimalMagicAttackTarget: No valid targets for magic attack specified!");
                return null;
            }

            let damagePotentials = [];

            for (let target of opponents) {
                //if target has no HP remaining, ignore
                if (target.stats.currentHP <= 0) {
                    Logger.logError("AIPlayer - findOptimalMagicAttackTarget: Target with no HP was checked!");
                } else {
                    //get all damage potentials
                    damagePotentials.push(new MagicAttackDamagePotential(actor, target));
                }
            }

            if (damagePotentials.length <= 0) {
                Logger.logError("AIPlayer - findOptimalAttackTarget: No valid damage potentials exist!");
                return null;
            }

            //if we have one or more kills, return one at random
            let targetsKilled = damagePotentials.filter((potential) => potential.killsTarget);
            if (targetsKilled.length > 0) {
                return Utils.getRandomElement(targetsKilled);
            }

            //Otherwise, get highest damage potential
            //Sort descending
            damagePotentials.sort((a, b) => {
                return b.damagePotential - a.damagePotential;
            });

            //if we have ties for best targets, we need to pick one randomly
            let bestTargets = [damagePotentials.shift()];
            while (damagePotentials.length > 0 && bestTargets[bestTargets.length - 1].damagePotential == damagePotentials[0].damagePotential) {
                bestTargets.push(damagePotentials.shift());
            }
            return Utils.getRandomElement(bestTargets);
        }

        /**
         * Returns a character with the lowest HP among a list of characters.
         * @param {character[]]} characters - characters to use for comparison
         * @returns {character} lowest HP character identified
         */
        findLowestHPCharacter(characters) {
            if (characters.length === 0) {
                Logger.logError("AIPlayer - findLowestHPCharacter: No characters to evaluate!");
                return null;
            }

            characters.sort((a, b) => {
                return a.stats.currentHP - b.stats.currentHP;
            });

            return characters[0];
        }
    }

    module.exports = AIPlayer;