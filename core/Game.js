/**
 * TODO - REFACTORING:
 * - Class for "ActingCharacter"
 * - Class for "Action"
 * - Method for "RemoveDeadCharactersFromQueue"
 * - Method for "ExecuteDirectorAction" - simplify process turn logic
 * - Method for "ExecuteAction" - simplify process turn logic
 * 
 * TODO - FEATURES:
 * - Add separate queue for director actions?
 * */

const RNG = require('../utils/RNG');
const Utils = require('../utils/Utils');
const Constants = require('../utils/Constants');
const GameState = require('./GameState');
const InitialLog = require('../logging/InitialLog');
const TimeStepLog = require('../logging/TimeStepLog');
const Logger = require('../logging/Logger');
const CharacterActionLog = require('../logging/CharacterActionLog');
const CharacterActionOutcomeLog = require('../logging/CharacterActionOutcomeLog');
const DirectorActionOutcomeLog = require('../logging/DirectorActionOutcomeLog');
const Action = require('./Action');
const DirectorActionLog = require('../logging/DirectorActionLog');
const ActionQueueLog = require('../logging/ActionQueueLog');

class Game {
    constructor(players, aiDirector, directorActionInterval = Constants.DIRECTOR_ACTION_INTERVAL, actionExecutionInterval = Constants.ACTION_EXECUTION_INTERVAL) {

        this.players = players;
        this.aiDirector = aiDirector;

        this.directorActionInterval = directorActionInterval;
        this.actionExecutionInterval = actionExecutionInterval;

        //Logging for game
        this.logger = new Logger();

        //Set initial HP counts for logging/gamestate
        let player1TotalHP = 0;
        let player2TotalHP = 0;
        for (let player of this.players) {
            for (let character of player.characters) {
                if (player.playerNumber == 1) {
                    player1TotalHP += character.stats.HP;
                } else {
                    player2TotalHP += character.stats.HP;
                }
            }
        }

        //update initial logging with HP counts
        this.logger.initialLog.initInitialLog(player1TotalHP, player2TotalHP);

        //configure gameState for AIDirector Usage
        this.gameState = new GameState(this.players, directorActionInterval, actionExecutionInterval, this.logger);
        this.logger.gameState = this.gameState;

        //link to AI Director if it exists
        if (this.aiDirector) {
            this.aiDirector.gameState = this.gameState;
        }

        //link to characters
        for (let player of this.players) {
            for (let character of player.characters) {
                character.gameState = this.gameState;
            }
        }

        //set initial gamestate for players
        this.gameState.initPlayer1Data(player1TotalHP);
        this.gameState.initPlayer2Data(player2TotalHP);

        //add initial state for action to HP data
        this.gameState.actionCurrHPData.push([
            this.gameState.totalPlayerActions,
            this.gameState.player1Data.currentHP,
            this.gameState.player2Data.currentHP,
            this.gameState.currentTotalHP
        ]); //update based on array
    }

    /**Runs a single timestep of the game, enqueuing/executing any relevant actions and checking for end conditions*/
    processTurn() {
        this.gameState.timeStep++;

        // Remove dead characters from action queue - but only for character actions
        this.gameState.actionQueue = this.gameState.actionQueue.filter(action => {
            return action.character ? action.character.isAlive() : true; // Keep AI Director actions
        });

        //init log for this time step
        let timeStepLog = new TimeStepLog(this.gameState.timeStep);

        //Add any new actions for characters with full speed meter
        let actingCharacters = [];
        this.players.forEach(player => {
            player.characters.forEach(character => {
                if (character.isAlive()) {
                    character.addActionPoints();
                    if (character.actionBar >= 100) {
                        actingCharacters.push({
                            "player": player,
                            "character": character
                        });
                        character.resetActionBar();
                    }
                }
            });
        });

        //execute based on fastest speed
        actingCharacters.sort((a, b) => this.compareSpeed(a.character, b.character));

        //add actions to queue
        for (let actingCharacter of actingCharacters) {
            this.enqueueAction(actingCharacter.player, actingCharacter.character);
        }

        //before executing actions, save previous turn's number of actions
        this.gameState.prevTotalPlayerActions = this.gameState.totalPlayerActions;

        //if the difference between the current time step and the action timestep is >= actionExecution interval, 
        //continue executing

        while (this.gameState.actionQueue.length > 0 && this.gameState.timeStep - this.gameState.actionQueue[0].timeStepQueued >= this.actionExecutionInterval) {
            let action = this.gameState.actionQueue.shift();

            if (action.type != 'buff' || action.type != 'nerf' || action.type != 'heal' || action.type != 'damage') {
                this.executeAction(action, timeStepLog); // Handle character actions
                const currentTotalHP = this.gameState.player1Data.currentHP + this.gameState.player2Data.currentHP;
                this.gameState.actionCurrHPData.push([
                    this.gameState.totalPlayerActions,
                    this.gameState.player1Data.currentHP,
                    this.gameState.player2Data.currentHP,
                    this.gameState.currentTotalHP
                ]); //update based on array
            }
        }

        // Balance the game every n=directorActionInterval steps
        if (this.gameState.timeStep % this.directorActionInterval === 0 && this.aiDirector) {
            let directorActions = this.aiDirector.balanceGame(this.players, this.log, this.gameState.timeStep, this.gameState.actionQueue);
            let containsMultipleActions = Array.isArray(directorActions);

            if (!containsMultipleActions && directorActions) {
                directorActions = [directorActions];
            }

            directorActions = directorActions.filter(Boolean); //remove null (caused by invalid changes)

            if (directorActions) {
                for (let action of directorActions) {
                    this.executeAIDirectorAction(action, timeStepLog);
                }
            }
        }

        //update gamestate after all actions have resolved
        //TODO: Got to be a better way to do this...
        if (this.players[0].playerNumber === 1) {
            this.gameState.updatePlayer1Data(this.players[0]);
            this.gameState.updatePlayer2Data(this.players[1]);
        } else {
            this.gameState.updatePlayer1Data(this.players[1]);
            this.gameState.updatePlayer2Data(this.players[0]);
        }

        this.gameState.updateTotalHP(this.players);

        //Update player logs

        //Add player data to log
        for (let player of this.players) {
            let playerNumber = player.playerNumber;
            for (let character of player.characters) {

            }
        }

        //log actionsInQueue, post execution
        timeStepLog.actionsInQueue = new ActionQueueLog(this.gameState.actionQueue);

        // Push the time step log to the main log array
        this.logger.logTimeStep(timeStepLog);
    }

    /** Shows which character has a faster speed. If they are tied, one is randomly selected. */
    compareSpeed(characterA, characterB) {
        let comparator = characterB.stats.Speed - characterA.stats.Speed;
        if (comparator > 0) {
            return 1;
        } else if (comparator < 0) {
            return -1;
        } else { //if there is a speed tie, pick randomly
            if (Math.random() < 0.5) {
                return 1;
            } else {
                return -1;
            }
        }
    }

    checkGameOver() {
        for (let player of this.players) {
            if (player.characters.every(c => !c.isAlive())) {
                return player.playerNumber; // Return the player number who lost
            }
        }
        return null; // No player has lost yet
    }

    /**
     * Adds an action to the actionQueue for execution for a given character.
     * @param {AIPlayer} player - the controlling player.
     * @param {Character} actor - the acting character.
     * @returns {bool} Whether or not the action was successfully queued.*/
    enqueueAction(player, actor) {
        if (!actor.isAlive()) {
            return; // Skip enqueuing the action if the character is dead
        }

        const opponent = this.players.find(p => p !== player);

        const chosenAction = player.chooseAction(actor, player.characters, opponent.characters);
        if (!chosenAction) {
            this.logger.logError("Game - enqueueAction: No action selected!");
            return false;
        }

        let action = new Action(actor, chosenAction.action, chosenAction.actionScore.targets, this.gameState.timeStep);

        this.gameState.actionQueue.push(action);
        return true;
    }



    /**Executes an action object.
     * @param {Action} The action to be performed.
     * @returns {CharacterActionOutcomeLog} Details on if the action was successful.
     * */
    executeAction(action, timeStepLog) {

        let characterActionOutcomeLog = new CharacterActionOutcomeLog(action);


        // If this character is currently defending, stop
        if (action.actor.defenseBoosted) {
            action.actor.resetDefense;
            characterActionOutcomeLog.setDefenseBoostReset(true);
        }

        // Filter out dead targets
        const aliveTargets = action.targets.filter((target) => target.isAlive());

        if (aliveTargets.length === 0 && action.action.type !== 'defend') {
            this.logger.logError(`Game - executeAction: ${action.actor.name} from ${action.actor.playerNumber} attempted to perform an action on a target that is no longer alive.`);
            return; // If there are no alive targets, skip this action entirely
        }

        //update data for actions taken
        this.gameState.incrementTotalPlayerActions();
        if (action.actor.playerNumber === 1) {
            this.gameState.incrementPlayer1CharacterAction(action.actor);
        } else {
            this.gameState.incrementPlayer2CharacterAction(action.actor);
        }

        //Logging for Player Action
        let actionMessage = `Game - executeAction: Player ${action.actor.playerNumber}'s ${action.actor.name} is using ${action.action.type}. `;

        const defeatedCharacters = []; // Keep track of defeated characters in this action

        switch (action.action.type) {
            case "attack":
                {
                    let prevCurrentHP = action.targets[0].stats.currentHP;
                    let damage = Utils.round(action.actor.dealAttackDamage(action.targets[0], Constants.SINGLE_TARGET_SCALAR));
                    actionMessage += `Deals ${damage} damage to player ${action.targets[0].playerNumber}'s ${action.targets[0].name}. `;
                    characterActionOutcomeLog.addTargetOutcome(action.targets[0], action, prevCurrentHP, null, null);
                    break;
                }
            case "multi_attack":
                {
                    for (let target of aliveTargets) {
                        let prevCurrentHP = target.stats.currentHP;
                        let damage = Utils.round(action.actor.dealAttackDamage(target, Constants.MULTI_TARGET_SCALAR));
                        actionMessage += `Deals ${damage} damage to player ${target.playerNumber}'s ${target.name}. `;
                        characterActionOutcomeLog.addTargetOutcome(target, action, prevCurrentHP, null, null);
                    }
                    break;
                }
            case 'magic_attack':
                {
                    let prevCurrentHP = action.targets[0].stats.currentHP;
                    let damage = Utils.round(action.actor.dealMagicAttackDamage(action.targets[0], Constants.SINGLE_TARGET_SCALAR));
                    actionMessage += `Deals ${damage} damage to player ${action.targets[0].playerNumber}'s ${action.targets[0].name}. `;
                    characterActionOutcomeLog.addTargetOutcome(action.targets[0], action, prevCurrentHP, null, null);
                    break;
                }

            case 'multi_magic_attack':
                {
                    for (let target of aliveTargets) {
                        let prevCurrentHP = target.stats.currentHP;
                        let damage = Utils.round(action.actor.dealMagicAttackDamage(target, Constants.MULTI_TARGET_SCALAR));
                        actionMessage += `Deals ${damage} damage to player ${target.playerNumber}'s ${target.name}. `;
                        characterActionOutcomeLog.addTargetOutcome(target, action, prevCurrentHP, null, null);
                    }
                    break;
                }
            case 'heal':
                {
                    let prevCurrentHP = action.targets[0].stats.currentHP;
                    let healAmount = Utils.round(action.actor.performHeal(action.targets[0], Constants.HEAL_SCALAR));
                    actionMessage += `Heals ${healAmount} health to player ${action.targets[0].playerNumber}'s ${action.targets[0].name}. `;
                    characterActionOutcomeLog.addTargetOutcome(action.targets[0], action, prevCurrentHP, null, null);
                    break;
                }
            case 'multi_heal':
                {
                    for (let target of aliveTargets) {
                        let prevCurrentHP = target.stats.currentHP;
                        let healAmount = Utils.round(action.actor.performHeal(target, Constants.HEAL_SCALAR));
                        actionMessage += `Heals ${healAmount} health to player ${target.playerNumber}'s ${target.name}. `;
                        characterActionOutcomeLog.addTargetOutcome(target, action, prevCurrentHP, null, null);
                    }
                    break;
                }
            case 'defend':
                {
                    let prevDefense = action.actor.stats.Defense;
                    let prevMagicDefense = action.actor.stats.MagicDefense;
                    action.actor.applyDefenseBoost();
                    actionMessage += `${action.actor.name} is defending. `;
                    characterActionOutcomeLog.addTargetOutcome(action.actor, action, null, prevDefense, prevMagicDefense);
                    break;
                }
            default:
                {
                    this.logger.logError(`Invalid action type specified: ${action.action.type}`);
                }
        }

        this.logger.logAction(actionMessage);

        //TODO: Check if I need this...
        aliveTargets.forEach(target => {
            if (!target.isAlive()) {
                defeatedCharacters.push(target);
            }
        });

        defeatedCharacters.forEach(target => {
            this.logger.logAction(`Game - executeAction: ${target.playerNumber}'s ${target.name} has been killed!`);
        });

        return characterActionOutcomeLog;
    }

    /** Executes an AI Director Action and returns a log detailing outcomes. */
    executeAIDirectorAction(action) {
        let {
            type,
            targets,
            stats,
            amount,
            playerNum
        } = action;
        let actionMessage = `AI Director: is using ${type}. `;

        //I can refactor/consolidate this.
        if (type === 'buff') {
            for (let target of targets) {
                for (let stat of stats) {
                    switch (target.name) {
                        case 'warrior':
                            this.updateWarriorStat(target, stat, amount);
                            break;
                        case 'mage':
                            this.updateMageStat(target, stat, amount);
                            break;
                        case 'priest':
                            this.updatePriestStat(target, stat, amount);
                            break;
                        case 'rogue':
                            this.updateRogueStat(target, stat, amount);
                            break;
                        default:
                            this.logger.logError(`AI Director: No valid target/stat to buff. Attempted to ${type} ${stat}`);
                            break;
                    }
                    actionMessage += ` ${type} player ${target.playerNumber}'s ${target.name}'s ${stat} by ${amount}. New value: ${target.stats[stat]}`;
                }
            }
        } else if (type === 'nerf') {
            for (let target of targets) {
                for (let stat of stats) {
                    switch (target.name) {
                        //TODO: am I going to have this  
                        case 'warrior':
                            this.updateWarriorStat(target, stat, amount);
                            break;
                        case 'mage':
                            this.updateMageStat(target, stat, amount);
                            break;
                        case 'priest':
                            this.updatePriestStat(target, stat, amount);
                            break;
                        case 'rogue':
                            this.updateRogueStat(target, stat, amount);
                            break;
                        default:
                            this.logger.logError(`AI Director: No valid target/stat to buff. Attempted to ${type} ${stat}`);
                            break;
                    }
                    actionMessage += ` ${type} player ${target.playerNumber}'s ${target.name}'s ${stat} by ${amount}. New value: ${target.stats[stat]}`;
                }
            }
            //TODO
        } else if (type === 'heal') {
            for (let target of targets) {
                //TODO: refactor out
                target.stats['currentHP'] += amount;
                target.stats['currentHP'] = Math.min(target.baseStats['HP'], target.stats['currentHP']);
                actionMessage += ` healing 'currentHP' by ${amount}. New value: ${target.stats['currentHP']}`;
            }
        } else if (type === 'damage') {
            //TODO: refactor out
            for (let target of targets) {
                target.stats['currentHP'] -= amount;
                target.stats['currentHP'] = Math.max(0, target.stats['currentHP']);
                actionMessage += ` damaging 'currentHP' by ${amount}. New value: ${target.stats['currentHP']}`;
            }
        }

        //Log action
        this.logger.logAction(actionMessage);



        // Log the executed action for this step
        const actionDetails = {
            player: 'AI Director',
            character: targets,
            actionType: type,
            playerNum: playerNum,
            statChanged: stats,
            amountChanged: amount
        };

        //
        //stepLog.actionsExecuted.push(actionDetails);
    }

    runSimulation(maxSteps = Infinity) {
        let winner = null;
        while (!winner && this.gameState.timeStep < maxSteps) {
            this.processTurn();
            winner = this.checkGameOver();
        }
        console.log("Game Over");
        if (winner) {
            console.log(`Player ${winner} lost!`);
        } else {
            console.log("Game ended due to max steps.");
        }
        console.log(this.gameState.totalPlayerActions);
        this.outputLog(); // Output the log at the end of the simulation
    }



    outputLog() {
        console.log("PAUSING LOGS... TODO");
        // const jsonLog = JSON.stringify(this.log, null, 2);
        // const fileName = `simulation_log_${Date.now()}.json`;
        // const filePath = path.join(this.logDirectory, fileName); // Use the log directory

        // console.log(`Saving log to: ${filePath}`);

        // // Save the log to a file using fs.writeFileSync(fileName, jsonLog);
        // fs.writeFileSync(filePath, jsonLog);
    }


    //TODO: Move these to AIDirector class.
    updateMageStat(target, stat, change) {
        switch (stat) {
            case 'Attack':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.MAGE_ATTACK_MAX, Math.max(Constants.MAGE_ATTACK_MIN, target.stats[stat]));
                break;
            case 'MagicAttack':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.MAGE_MAGIC_ATTACK_MAX, Math.max(Constants.MAGE_MAGIC_ATTACK_MIN, target.stats[stat]));
                break;
            case 'Defense':
                target.baseStats[stat] += change;
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.MAGE_DEFENSE_MAX, Math.max(Constants.MAGE_DEFENSE_MIN, target.stats[stat]));
                break;
            case 'MagicDefense':
                target.baseStats[stat] += change;
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.MAGE_MAGIC_DEFENSE_MAX, Math.max(Constants.MAGE_MAGIC_DEFENSE_MIN, target.stats[stat]));
                break;
            case 'Speed':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.MAGE_SPEED_MAX, Math.max(Constants.MAGE_SPEED_MIN, target.stats[stat]));
                break;
            case 'Luck':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.MAGE_LUCK_MAX, Math.max(Constants.MAGE_LUCK_MIN, target.stats[stat]));
                break;
            default:
                console.log("Invalid stat specified to change.");
                break;
        }
    }

    updateWarriorStat(target, stat, change) {
        switch (stat) {
            case 'Attack':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.WARRIOR_ATTACK_MAX, Math.max(Constants.WARRIOR_ATTACK_MIN, target.stats[stat]));
                break;
            case 'MagicAttack':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.WARRIOR_MAGIC_ATTACK_MAX, Math.max(Constants.WARRIOR_MAGIC_ATTACK_MIN, target.stats[stat]));
                break;
            case 'Defense':
                target.baseStats[stat] += change;
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.WARRIOR_DEFENSE_MAX, Math.max(Constants.WARRIOR_DEFENSE_MIN, target.stats[stat]));
                break;
            case 'MagicDefense':
                target.baseStats[stat] += change;
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.WARRIOR_MAGIC_DEFENSE_MAX, Math.max(Constants.WARRIOR_MAGIC_DEFENSE_MIN, target.stats[stat]));
                break;
            case 'Speed':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.WARRIOR_SPEED_MAX, Math.max(Constants.WARRIOR_SPEED_MIN, target.stats[stat]));
                break;
            case 'Luck':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.WARRIOR_LUCK_MAX, Math.max(Constants.WARRIOR_LUCK_MIN, target.stats[stat]));
                break;
            default:
                console.log("Invalid stat specified to change.");
                break;
        }
    }

    updatePriestStat(target, stat, change) {
        switch (stat) {
            case 'Attack':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.PRIEST_ATTACK_MAX, Math.max(Constants.PRIEST_ATTACK_MIN, target.stats[stat]));
                break;
            case 'MagicAttack':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.PRIEST_MAGIC_ATTACK_MAX, Math.max(Constants.PRIEST_MAGIC_ATTACK_MIN, target.stats[stat]));
                break;
            case 'Defense':
                target.baseStats[stat] += change;
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.PRIEST_DEFENSE_MAX, Math.max(Constants.PRIEST_DEFENSE_MIN, target.stats[stat]));
                break;
            case 'MagicDefense':
                target.baseStats[stat] += change;
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.PRIEST_MAGIC_DEFENSE_MAX, Math.max(Constants.PRIEST_MAGIC_DEFENSE_MIN, target.stats[stat]));
                break;
            case 'Speed':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.PRIEST_SPEED_MAX, Math.max(Constants.PRIEST_SPEED_MIN, target.stats[stat]));
                break;
            case 'Luck':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.PRIEST_LUCK_MAX, Math.max(Constants.PRIEST_LUCK_MIN, target.stats[stat]));
                break;
            default:
                console.log("Invalid stat specified to change.");
                break;
        }

    }

    updateRogueStat(target, stat, change) {
        switch (stat) {
            case 'Attack':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.ROGUE_ATTACK_MAX, Math.max(Constants.ROGUE_ATTACK_MIN, target.stats[stat]));
                break;
            case 'MagicAttack':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.ROGUE_MAGIC_ATTACK_MAX, Math.max(Constants.ROGUE_MAGIC_ATTACK_MIN, target.stats[stat]));
                break;
            case 'Defense':
                target.baseStats[stat] += change;
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.ROGUE_DEFENSE_MAX, Math.max(Constants.ROGUE_DEFENSE_MIN, target.stats[stat]));
                break;
            case 'MagicDefense':
                target.baseStats[stat] += change;
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.ROGUE_MAGIC_DEFENSE_MAX, Math.max(Constants.ROGUE_MAGIC_DEFENSE_MIN, target.stats[stat]));
                break;
            case 'Speed':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.ROGUE_SPEED_MAX, Math.max(Constants.ROGUE_SPEED_MIN, target.stats[stat]));
                break;
            case 'Luck':
                target.stats[stat] += change;
                target.stats[stat] = Math.min(Constants.ROGUE_LUCK_MAX, Math.max(Constants.ROGUE_LUCK_MIN, target.stats[stat]));
                break;
            default:
                console.log("Invalid stat specified to change.");
                break;
        }
    }

    /**
     * Finds a player by their player number.
     * @param {double} playerNumber - the number of the player
     * @returns {AIPlayer} player - the corresponding player object
     * */
    getPlayerByNum(playerNumber) {
        for (let player of this.players) {
            if (player.playerNumber === playerNumber) {
                return player;
            }
        }
        this.logger.logError("Game - getPlayerByNum: No player found for number!");
        return null;
    }
}

module.exports = Game;