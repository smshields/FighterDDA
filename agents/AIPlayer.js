/**
 * TODO: REFACTORING - 
 * - Make action types constants
 * - Make agent behavior types constants 
 * - Consider making a DefensePotential class for consistency
 * - Make object that represents object scores
 * 
 * TODO: DOCUMENTATION -
 * - findOptimalHealTarget
 * */

const Utils = require('../utils/Utils');
const RNG = require('../utils/RNG');
const Logger = require('../logging/Logger');
const AttackDamagePotential = require('./action_potential/AttackDamagePotential');
const MultiAttackDamagePotential = require('./action_potential/MultiAttackDamagePotential');
const MagicAttackDamagePotential = require('./action_potential/MagicAttackDamagePotential');
const MultiMagicAttackDamagePotential = require('./action_potential/MultiMagicAttackDamagePotential');
const HealPotential = require('./action_potential/HealPotential');
const MultiHealPotential = require('./action_potential/MultiHealPotential');
const ActionScore = require('./action_score/ActionScore');
const ChosenAction = require('./action_score/ChosenAction');

/** Class that contains the Player agent. Can be set to have different performances. Uses a utility algorithm to make decisions.*/
class AIPlayer {
    constructor(playerNumber, characters, mode = Constants.OPTIMAL_PLAYER_AI_MODE, actionRandomness = Constants.PLAYER_AI_RANDOMNESS) {
        this.playerNumber = playerNumber;
        this.characters = characters;
        this.mode = mode; // 'optimal', 'griefer', random
        this.actionRandomness = actionRandomness;

        this.logger = new Logger();
    }


    /**
     * Chooses action based on best utility and agent parameters
     * @param {Character} actor - the acting character
     * @param {Character[]} allies - the acting character's teammate characters
     * @param {Character[]} opponents - the acting character's opponent's characters
     * */
    chooseAction(actor, allies, opponents) {
        let actionScores = [];

        for (let action of actor.actions) {
            actionScores.push(this.evaluateAction(actor, allies, opponents, action.type));
        }

        if (actionScores.length <= 0) {
            this.logger.logError("AIPlayer - chooseAction: No actions able to be scored! Returning null.");
            return null;
        }

        //select an action
        let selectedActionScore = this.selectActionFromScores(actionScores);

        //get action object
        let actionObject = actor.actions.filter(action => {
            return action.type === selectedActionScore.actionType
        });

        //return action
        return new ChosenAction(selectedActionScore, actionObject[0]);
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
                    this.logger.logError("AIPlayer - evaluateAction: No valid action type specified! " + actionType);
                    return 0;
                }
        }
    }

    /**
     * Looks at an array of scores and provides one to execute based on mode, randomness.
     * Behavior mode details:
     * 
     * Optimal - Randomness = 0, always pick highest score. Randomness = 1, pick according to scoring distribution
     * Griefer - Randomness = 0, always pick lowest score. Randomness = 1, pick according to inverted scoring distribution
     * Random - Always pick a random action.
     * 
     * @param {ActionScore[]} actionScores - a list containing all scored actions.
     * @returns {ActionScore} the selected action.
     * */
    selectActionFromScores(actionScores) {
        if (this.mode !== Constants.RANDOM_PLAYER_AI_MODE) {

            //If we are griefing, first invert all weights
            if (this.mode === Constants.GRIEFER_PLAYER_AI_MODE) {
                for (let actionScore of actionScores) {
                    actionScore.score = 1 - actionScore.score;
                }
            }

            //sort descending
            actionScores.sort((a, b) => {
                return a.score - b.score;
            });

            //remove any top-scoring values and ties; these will 
            let highestScores = [];
            highestScores[0] = actionScores.shift();
            while (actionScores.length > 0 && actionScores[0] === highestScores[0]) {
                highestScores.push(actionScores.shift());
            }

            let totalValue = 0;
            //For each weight, using a 2D graph with x as 1 - randomness and y as weight:
            //Find slope between (0, weight) and (1, 0)
            //Use new slope to find new weight (new x is set randomness)
            for (let actionScore of actionScores) {
                let slope = Utils.getSlopeFromPoints(0, actionScore.score, 1, 0);
                let newWeight = (slope * (1 - Constants.PLAYER_AI_RANDOMNESS)) + actionScore.score; //get score with corresponding randomness change
                actionScore.score = newWeight;
                totalValue += actionScore.score;
            }

            //add highest scores back into array
            for (let highScore of highestScores) {
                totalValue += highScore.score;
                actionScores.unshift(highScore);
            }

            let randomNumber = RNG.next() * totalValue;
            let cumulativeValue = 0;

            //use weighted random to select choice (modified by randomness - if 0 highest scores will be only thing > 0)
            for (let actionScore of actionScores) {
                cumulativeValue += actionScore.score;
                if (randomNumber <= cumulativeValue) {
                    return actionScore;
                }
            }
        }

        //If above algorithm fails, or we have Random AI mode enabled, just pick an element at random
        return Utils.getRandomElement(actionScores);
    }

    /**
     * Looks at an acting character and scores the utility of attacking a single opponent.
     * @param {character} actor - the acting character.
     * @param {character[]]} opponents - all characters on the opponent's team.
     * @returns {ActionScore} a score from 0-1 detailing utility of attacking.
     */
    evaluateAttack(actor, opponents) {
        let attackActionScore = new ActionScore(Constants.ATTACK_ACTION_TYPE, -1, null);

        //Safety checks
        if (!actor) {
            this.logger.logError("AIPlayer - evaluateAttack: No attacking character specified!");
            return attackActionScore;
        }

        if (opponents.length <= 0) {
            this.logger.logError("AIPlayer - evaluateAttack: No valid targets for attack specified!");
            return attackActionScore;
        }

        //Identify best target - returns a character
        let bestAttackDamagePotential = this.findOptimalAttackTarget(actor, opponents);

        if (!bestAttackDamagePotential) {
            this.logger.log("AIPlayer - evaluateAttack: No optimal target for attacking found!");
            return attackActionScore;
        }

        //If it kills, weight very highly. Otherwise, do it proportional to damage potential
        if (bestAttackDamagePotential.killsTarget) {
            attackActionScore.score = 1;
            attackActionScore.targets = [bestAttackDamagePotential.target];
        } else {
            attackActionScore.score = Utils.clamp(bestAttackDamagePotential.damagePotential / bestAttackDamagePotential.target.stats.currentHP, 0, 1);
            attackActionScore.targets = [bestAttackDamagePotential.target];
        }
        return attackActionScore;
    }

    /**
     * Looks at an acting character and scores the utility of attacking multiple opponents.
     * @param {Character} actor - the acting character.
     * @param {Character[]} opponents - all characters on the opponent's team.
     * @returns {ActionScore} a score from 0-1 detailing utility of attacking.
     * */
    evaluateMultiAttack(actor, targets) {
        let multiAttackActionScore = new ActionScore(Constants.MULTI_ATTACK_ACTION_TYPE, -1, null);

        //Safety checks
        if (!actor) {
            this.logger.logError("AIPlayer - evaluateMultiAttack: No attacking character specified!");
            return multiAttackActionScore;
        }

        if (targets.length <= 0) {
            this.logger.logError("AIPlayer - evaluateMultiAttack: No valid targets for attack specified!");
            return multiAttackActionScore;
        }

        //no need to evaluate for best target, just get total damage potential
        let multiAttackDamagePotential = new MultiAttackDamagePotential(actor, targets);

        if (multiAttackDamagePotential.numberOfKills > 0) {
            multiAttackActionScore.score = 1;
            multiAttackActionScore.targets = targets;
        } else {
            //TODO: Get access to game state to avoid recalculating here.
            let totalCurrentHP = 0;
            for (let target of targets) {
                totalCurrentHP += target.stats.currentHP;
            }
            multiAttackActionScore.score = Utils.clamp(multiAttackDamagePotential.totalDamagePotential / totalCurrentHP, 0, 1);
            multiAttackActionScore.targets = targets;
        }
        return multiAttackActionScore;
    }

    /**
     * Looks at an acting character and scores the utility of magic attacking a single opponent.
     * @param {character} actor - the acting character.
     * @param {character[]]} opponents - all characters on the opponent's team.
     * @returns {ActionScore} a score from 0-1 detailing utility of magic attacking.
     */
    evaluateMagicAttack(actor, targets) {
        let magicAttackActionScore = new ActionScore(Constants.MAGIC_ATTACK_ACTION_TYPE, -1, null);
        //Safety checks
        if (!actor) {
            this.logger.logError("AIPlayer - evaluateMagicAttack: No magic attacking character specified!");
            return magicAttackActionScore;
        }

        if (targets.length <= 0) {
            this.logger.logError("AIPlayer - evaluateMagicAttack: No valid targets for magic attack specified!");
            return magicAttackActionScore;
        }

        //Identify best target - returns a character
        let bestMagicAttackDamagePotential = this.findOptimalMagicAttackTarget(actor, targets);

        if (!bestMagicAttackDamagePotential) {
            this.logger.logError("AIPlayer - evaluateMagicAttack: No optimal target for magic attacking found!");
            return magicAttackActionScore;
        }

        //If it kills, weight very highly. Otherwise, do it proportional to damage potential
        if (bestMagicAttackDamagePotential.killsTarget) {
            magicAttackActionScore.score = 1;
            magicAttackActionScore.targets = [bestMagicAttackDamagePotential.target];
        } else {
            magicAttackActionScore.score = Utils.clamp(bestMagicAttackDamagePotential.damagePotential / bestMagicAttackDamagePotential.target.stats.currentHP, 0, 1);
            magicAttackActionScore.targets = [bestMagicAttackDamagePotential.target];
        }
        return magicAttackActionScore;
    }

    /**
     * Looks at an acting character and scores the utility of magic attacking multiple opponents.
     * @param {Character} actor - the acting character.
     * @param {Character[]} opponents - all characters on the opponent's team.
     * @returns {ActionScore} a score from 0-1 detailing utility of magic attacking.
     * */
    evaluateMultiMagicAttack(actor, targets) {
        let multiMagicAttackActionScore = new ActionScore(Constants.MULTI_MAGIC_ATTACK_ACTION_TYPE, -1, null);
        //Safety checks
        if (!actor) {
            this.logger.logError("AIPlayer - evaluateMultiMagicAttack: No magic attacking character specified!");
            return multiMagicAttackActionScore;
        }

        if (targets.length <= 0) {
            this.logger.logError("AIPlayer - evaluateMultiMagicAttack: No valid targets for magic attack specified!");
            return multiMagicAttackActionScore;
        }

        //no need to evaluate for best target, just get total damage potential
        let multiMagicAttackDamagePotential = new MultiMagicAttackDamagePotential(actor, targets);

        if (multiMagicAttackDamagePotential.numberOfKills > 0) {
            multiMagicAttackActionScore.score = 1;
            multiMagicAttackActionScore.targets = targets;

        } else {
            //TODO: Get access to game state to avoid recalculating here.
            let totalCurrentHP = 0;
            for (let target of targets) {
                totalCurrentHP += target.stats.currentHP;
            }
            multiMagicAttackActionScore.score = Utils.clamp(multiMagicAttackDamagePotential.totalDamagePotential / totalCurrentHP, 0, 1);
            multiMagicAttackActionScore.targets = targets;
        }
        return multiMagicAttackActionScore;
    }

    /**
     * Looks at an acting character and scores the utility of healing an ally.
     * @param {Character} actor - the acting character.
     * @param {Character[]} allies - all characters on the acting character's team.
     * @returns {ActionScore} a score from 0-1 detailing utility of healing a single target.
     * */
    evaluateHeal(actor, targets) {
        let healActionScore = new ActionScore(Constants.HEAL_ACTION_TYPE, -1, null);

        if (!actor) {
            this.logger.logError("AIPlayer - evaluateHeal: No healing character specified!");
            return healActionScore;
        }

        if (targets.length <= 0) {
            this.logger.logError("AIPlayer - evaluateHeal: No valid targets for healing specified!");
            return healActionScore;
        }

        //find lowest health ratio
        let bestHealPotential = this.findOptimalHealTarget(actor, targets);

        //heal should be prioritized the lower a character's hp ratio is
        let healUrgency = (1 - bestHealPotential.hpRatio) ** 2;
        //disincentivize heals that massively overheal a character
        let overHealPunish = 0;
        if (bestHealPotential.overHeals) {
            overHealPunish = (1 - bestHealPotential.overHealRatio);
        }

        healActionScore.score = Utils.clamp(healUrgency - overHealPunish, 0, 1);
        healActionScore.targets = [bestHealPotential.target];
        return healActionScore;
    }

    /**
     * Looks at an acting character and scores the utility of healing multiple allies.
     * @param {Character} actor - the acting character.
     * @param {Character[]} allies - all characters on the actor's team.
     * @returns {ActionScore} a score from 0-1 detailing utility of multi healing.
     * */
    evaluateMultiHeal(actor, targets) {
        let multiHealActionScore = new ActionScore(Constants.MULTI_HEAL_ACTION_TYPE, -1, null);
        //Safety checks
        if (!actor) {
            this.logger.logError("AIPlayer - evaluateMultiHeal: No healing character specified!");
            return multiHealActionScore;
        }

        if (targets.length <= 0) {
            this.logger.logError("AIPlayer - evaluateMultiHeal: No valid targets for healing specified!");
            return multiHealActionScore;
        }

        //no need to evaluate for best target, just get total damage potential
        let multiHealPotential = new MultiHealPotential(actor, targets);

        //heal should be prioritized the lower a team's hp ratio is
        let healUrgency = (1 - multiHealPotential.hpRatio) ** 2;
        //disincentivize heals that overheal a team
        let overHealPunish = 0;
        if (multiHealPotential.overHeals) {
            overHealPunish = (1 - multiHealPotential.overHealRatio);
        }

        multiHealActionScore.score = Utils.clamp(healUrgency - overHealPunish, 0, 1);
        multiHealActionScore.targets = targets;
        return multiHealActionScore;
    }

    /**
     * Looks at an acting character and scores the utility of defending.
     * @param {Character} actor - the acting character.
     * @param {Character[]} allies - all characters on the actor's team.
     * @returns {ActionScore} a score from 0-1 detailing utility of defending.
     **/
    evaluateDefend(actor, allies) {
        let defendActionScore = new ActionScore(Constants.DEFEND_ACTION_TYPE, -1, null);

        //Safety checks
        if (!actor) {
            this.logger.logError("AIPlayer - evaluateMultiHeal: No healing character specified!");
            return defendActionScore;
        }

        if (allies.length <= 0) {
            this.logger.logError("AIPlayer - evaluateMultiHeal: No valid targets for healing specified!");
            return defendActionScore;
        }

        //Check for allies who can heal (none decreases likelihood of defense)
        let healerUnavailable = true;
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

        if (healerUnavailable) {
            healerUnavailablePunish = defendUrgency / 2;
        }

        defendActionScore.score = Utils.clamp(defendUrgency - healerUnavailablePunish, 0, 1);
        defendActionScore.targets = [actor];
        return defendActionScore;
    }

    /**
     * Finds the best available individual healing target among allied targets
     * @param {Character} actor - the character to perform the heal action
     * @param {Character} allies - the available targets for the heal action
     * @returns {HealPotential} The best healing potential among available targets
     *  */
    findOptimalHealTarget(actor, allies) {
        if (!actor) {
            this.logger.logError("AIPlayer - findOptimalHealTarget: No healing character specified!");
            return null;
        }

        if (allies.length <= 0) {
            this.logger.logError("AIPlayer - findOptimalHealTarget: No valid targets for healing specified!");
            return null;
        }

        let healPotentials = [];

        for (let target of allies) {
            //if target has no HP remaining, ignore
            if (target.stats.currentHP <= 0) {
                this.logger.logError("AIPlayer - findOptimalHealTarget: Target with no HP was checked!");
            } else {
                //get all damage potentials
                healPotentials.push(new HealPotential(actor, target));
            }
        }

        if (healPotentials.length <= 0) {
            this.logger.logError("AIPlayer - findOptimalHealTarget: No valid healing potentials exist!");
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
            this.logger.logError("AIPlayer - findOptimalAttackTarget: No attacking character specified!");
            return null;
        }

        if (targets.length <= 0) {
            this.logger.logError("AIPlayer - findOptimalAttackTarget: No valid targets for attack specified!");
            return null;
        }

        let damagePotentials = [];

        for (let target of targets) {
            //if target has no HP remaining, ignore
            if (target.stats.currentHP <= 0) {
                this.logger.logError("AIPlayer - findOptimalAttackTarget: Target with no HP was checked!");
            } else {
                //get all damage potentials
                damagePotentials.push(new AttackDamagePotential(actor, target));
            }
        }

        if (damagePotentials.length <= 0) {
            this.logger.logError("AIPlayer - findOptimalAttackTarget: No valid damage potentials exist!");
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
            this.logger.logError("AIPlayer - findOptimalMagicAttackTarget: No magic attacking character specified!");
            return null;
        }

        if (targets.length <= 0) {
            this.logger.logError("AIPlayer - findOptimalMagicAttackTarget: No valid targets for magic attack specified!");
            return null;
        }

        let damagePotentials = [];

        for (let target of targets) {
            //if target has no HP remaining, ignore
            if (target.stats.currentHP <= 0) {
                this.logger.logError("AIPlayer - findOptimalMagicAttackTarget: Target with no HP was checked!");
            } else {
                //get all damage potentials
                damagePotentials.push(new MagicAttackDamagePotential(actor, target));
            }
        }

        if (damagePotentials.length <= 0) {
            this.logger.logError("AIPlayer - findOptimalAttackTarget: No valid damage potentials exist!");
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
            this.logger.logError("AIPlayer - findLowestHPCharacter: No characters to evaluate!");
            return null;
        }

        characters.sort((a, b) => {
            return a.stats.currentHP - b.stats.currentHP;
        });

        return characters[0];
    }
}

module.exports = AIPlayer;