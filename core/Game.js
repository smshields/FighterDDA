/**
 * TODO - REFACTORING:
 * - Class for "ActingCharacter"
 * - Class for "Action"
 * - Method for "RemoveDeadCharactersFromQueue"
 * - Method for "ExecuteDirectorAction" - simplify process turn logic
 * - Method for "ExecuteAction" - simplify process turn logic
 * - "ExecuteAction" should live in Action class, take gameState as parameter (?)
 * - "UpdateCharacterStat" should live in character class
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
const ActionQueueLog = require('../logging/ActionQueueLog');
const EndLog = require('../logging/EndLog');

class Game {
    constructor(players, aiDirector, directorActionInterval = Constants.DIRECTOR_ACTION_INTERVAL, actionExecutionInterval = Constants.ACTION_EXECUTION_INTERVAL, seed) {

        //Set up seeded RNG if specified.
        if (seed) {
            Constants.RNG_SEED = seed;
        } else {
            Constants.generateNewSeed();
        }

        RNG.setSeedFromConstants();





        this.players = players;
        this.aiDirector = aiDirector;

        this.directorActionInterval = directorActionInterval;
        this.actionExecutionInterval = actionExecutionInterval;

        //Logging for game
        this.logger = new Logger();

        let player1 = {};
        let player2 = {};

        //Set initial HP counts for logging/gamestate
        let player1TotalHP = 0;
        let player2TotalHP = 0;
        for (let player of this.players) {
            for (let character of player.characters) {
                if (player.playerNumber == 1) {
                    player1TotalHP += character.stats.HP;
                    player1 = player;
                } else {
                    player2TotalHP += character.stats.HP;
                    player2 = player;
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
        this.gameState.initPlayer1Data(player1TotalHP, player1.characters);
        this.gameState.initPlayer2Data(player2TotalHP, player2.characters);

        //add initial state for action to HP data
        //TODO: Make game object for this.
        this.gameState.actionCurrHPData.push([
            this.gameState.totalPlayerActions,
            this.gameState.player1Data.currentHP,
            this.gameState.player2Data.currentHP,
            this.gameState.currentHP
        ]); //update based on array
    }

    /**Runs a single timestep of the game, enqueuing/executing any relevant actions and checking for end conditions*/
    processTimeStep() {
        this.gameState.timeStep++;


        //Check for action blocks by looking at queue length pre/post filter
        let actionBlockCount = this.gameState.actionQueue.length;

        // Remove dead characters from action queue - but only for character actions
        this.gameState.actionQueue = this.gameState.actionQueue.filter(action => {
            return action.actor.isAlive() || action.actor === "AI Director"; // Keep AI Director actions
        });

        //if new length is shorter, we'll increment the gameState's action blocks property
        actionBlockCount = actionBlockCount - this.gameState.actionQueue.length;
        this.gameState.actionBlocks += actionBlockCount;

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
                    }
                }
            });
        });

        //execute based on filled action bar

        //execute based on fastest speed
        actingCharacters.sort((a, b) => this.compareActionMeter(a.character, b.character));

        //add actions to queue
        for (let actingCharacter of actingCharacters) {
            this.enqueueAction(actingCharacter.player, actingCharacter.character);
            actingCharacter.character.resetActionBar();
        }

        //before executing actions, save previous turn's number of actions
        this.gameState.prevTotalPlayerActions = this.gameState.totalPlayerActions;

        //if the difference between the current time step and the action timestep is >= actionExecution interval, 
        //continue executing

        while (this.gameState.actionQueue.length > 0 && this.gameState.timeStep - this.gameState.actionQueue[0].timeStepQueued >= this.actionExecutionInterval) {
            let action = this.gameState.actionQueue.shift();

            //TODO: Clean up this if statement with a better checking method
            if (!Constants.DIRECTOR_ACTION_TYPES.includes(action.type)) {
                let actionLog = this.executeAction(action);
                timeStepLog.actionsExecuted.push(actionLog); // Handle character actions, push details to log
                this.gameState.currentHP = this.gameState.player1Data.currentHP + this.gameState.player2Data.currentHP;
                this.gameState.actionCurrHPData.push([
                    this.gameState.totalPlayerActions,
                    this.gameState.player1Data.currentHP,
                    this.gameState.player2Data.currentHP,
                    this.gameState.currentHP
                ]); //update based on array

                let losingPlayer = this.checkGameOver(); //if an action results in a loss, end game
                if (losingPlayer) {
                    this.updateGameState();
                    this.updateTimeStepLog(timeStepLog);
                    return losingPlayer;
                }
            }
        }

        // Balance the game every n=directorActionInterval steps
        if (this.gameState.timeStep % this.directorActionInterval === 0 && this.aiDirector) {
            let directorActions = this.aiDirector.balanceGame(this.players, this.log, this.gameState.timeStep, this.gameState.actionQueue);
            let containsMultipleActions = Array.isArray(directorActions);

            if (!containsMultipleActions && directorActions) {
                directorActions = [directorActions];
            }


            if (directorActions) {
                directorActions = directorActions.filter(Boolean); //remove null (caused by invalid changes)
                for (let action of directorActions) {
                    let directorActionLog = this.executeAIDirectorAction(action);
                    timeStepLog.directorActions.push(directorActionLog); //Handle director actions, push details to log

                    let losingPlayer = this.checkGameOver(); //if a director action results in a loss, end game
                    if (losingPlayer) {
                        this.updateGameState();
                        this.updateTimeStepLog(timeStepLog);
                        return losingPlayer;
                    }
                }
            }
        }

        this.updateGameState();
        this.updateTimeStepLog(timeStepLog);

        return null; //if we haven't seen an action result in a loss, return null.
    }

    updateGameState() {
        if (this.players[0].playerNumber === 1) {
            this.gameState.updatePlayer1Data(this.players[0]);
            this.gameState.updatePlayer2Data(this.players[1]);
        } else {
            this.gameState.updatePlayer1Data(this.players[1]);
            this.gameState.updatePlayer2Data(this.players[0]);
        }

        this.gameState.updateTotalHP(this.players);
    }

    updateTimeStepLog(timeStepLog) {
        //update time step log from gamestate
        timeStepLog.updateLogFromGameState(this.gameState);

        // Push the time step log to the main log array
        this.logger.logTimeStep(timeStepLog);
    }

    /**shows which character has a larger action meter. If one is larger, it is ranked 
     * higher than other characters. If tied with another character, speed stats are 
     * used to tie break. If speed stats are tied, one character is randomly returned.
     * 
     * */

    compareActionMeter(characterA, characterB) {
        let comparator = characterB.actionBar - characterA.actionBar;
        if (comparator > 0) {
            return 1;
        } else if (comparator < 0) {
            return -1;
        } else { //if there is an action bar tie, resort to speed comparator
            return this.compareSpeed(characterA, characterB);
        }
    }

    /** Shows which character has a faster speed. If they are tied, one is randomly selected. */
    compareSpeed(characterA, characterB) {
        let comparator = characterB.stats.Speed - characterA.stats.Speed;
        if (comparator > 0) {
            return 1;
        } else if (comparator < 0) {
            return -1;
        } else { //if there is a speed tie, pick randomly
            if (RNG.next() < 0.5) {
                return 1;
            } else {
                return -1;
            }
        }
    }

    checkGameOver() {

        let drawCheck = 0;
        let losingPlayer = null;
        for (let player of this.players) {
            if (player.characters.every(c => !c.isAlive())) {
                drawCheck++;
                losingPlayer = player.playerNumber;
                return player.playerNumber; // Return the player number who lost
            }
        }

        //both players have died concurrently - very rare case when director over-acts
        if (drawCheck == 2) {
            return -1;
        }

        //game lasted more than 30 minutes, end and report
        if (this.gameState.timeStep + (this.gameState.totalPlayerActions * 3) >= Constants.MAX_GAME_LENGTH_SECONDS) {
            //TODO: Tiebreaker rules: # of living characters, then remaining HP ratio, then coin flip
            return -1;
        }

        return losingPlayer; //Null if no one has lost yet, otherwise player number
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
    executeAction(action) {

        let characterActionOutcomeLog = new CharacterActionOutcomeLog(action, this.gameState.timeStep);


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
        let isMulti = action.action.type.includes("multi"); //track total single/multi actions for each character
        if (action.actor.playerNumber === 1) {
            this.gameState.incrementPlayer1CharacterAction(action.actor, isMulti);
        } else {
            this.gameState.incrementPlayer2CharacterAction(action.actor, isMulti);
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
                        let healAmount = Utils.round(action.actor.performHeal(target, Constants.MULTI_HEAL_SCALAR));
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

        this.logger.logAction(actionMessage, Constants.ACTION_CONSOLE_FORMATTING);

        //TODO: Check if I need this...
        aliveTargets.forEach(target => {
            if (!target.isAlive()) {
                defeatedCharacters.push(target);
            }
        });

        defeatedCharacters.forEach(target => {
            this.logger.logAction(`Game - executeAction: ${target.playerNumber}'s ${target.name} has been killed!`, Constants.CHARACTER_KILLED_CONSOLE_FORMATTING);
        });

        return characterActionOutcomeLog;
    }

    /** Executes an AI Director Action and returns a log detailing outcomes. */
    executeAIDirectorAction(action) {
        let actionMessage = `Game - executeAIDirectorAction: Director is applying ${action.type}. `;

        //TODO: Move update stats to character class.
        if (action.type === 'buff' || action.type === 'nerf') {
            for (let target of action.characterTargets) {
                for (let stat of action.stats) {
                    let statChange = action.statChange;
                    if (action.type === 'nerf') {
                        statChange = -1 * statChange;
                    }


                    switch (target.name) {
                        case 'warrior':
                            this.updateWarriorStat(target, stat, statChange);
                            break;
                        case 'mage':
                            this.updateMageStat(target, stat, statChange);
                            break;
                        case 'priest':
                            this.updatePriestStat(target, stat, statChange);
                            break;
                        case 'rogue':
                            this.updateRogueStat(target, stat, statChange);
                            break;
                        default:
                            this.logger.logError(`Game - executeAIDirectorAction: No valid target/stat to ${action.type}. Attempted to ${action.type} ${stat}`);
                            break;
                    }
                    actionMessage += ` ${action.type} player ${target.playerNumber}'s ${target.name}'s ${stat} by ${action.statChange}. New value: ${target.stats[stat]}`;
                }
            }
        } else if (action.type === 'environment buff' || action.type === 'environment nerf') {
            let prevDamageScalar = Constants.SINGLE_TARGET_SCALAR;
            let prevMultiDamageScalar = Constants.MULTI_TARGET_SCALAR;
            let prevHealScalar = Constants.HEAL_SCALAR;
            let prevMultiHealScalar = Constants.MULTI_HEAL_SCALAR;
            this.updateScalars(action.statChange);
            actionMessage += `${action.type} updates 
            HEAL_SCALAR from ${prevHealScalar} to ${Constants.HEAL_SCALAR}. 
            MULTI_HEAL_SCALAR from ${prevMultiHealScalar} to ${Constants.MULTI_HEAL_SCALAR}. 
            SINGLE_TARGET_SCALAR from ${prevDamageScalar} to ${Constants.SINGLE_TARGET_SCALAR}. 
            MULTI_TARGET_SCALAR from ${prevMultiDamageScalar} to ${Constants.MULTI_TARGET_SCALAR}.`

        } else if (action.type === 'heal') {
            for (let target of action.characterTargets) {
                //TODO: refactor out
                target.stats['currentHP'] += action.statChange;
                target.stats['currentHP'] = Math.min(target.baseStats['HP'], target.stats['currentHP']);
                actionMessage += ` healing 'currentHP' by ${action.statChange}. New value: ${target.stats['currentHP']}`;
            }
        } else if (action.type === 'damage') {
            //TODO: refactor out
            for (let target of action.characterTargets) {
                target.stats['currentHP'] -= action.statChange;
                target.stats['currentHP'] = Math.max(0, target.stats['currentHP']);
                actionMessage += ` damaging 'currentHP' by ${action.statChange}. New value: ${target.stats['currentHP']}`;
            }
        }

        //Log action
        this.logger.logAction(actionMessage, Constants.DIRECTOR_CONSOLE_FORMATTING);

        //return execution details
        return new DirectorActionOutcomeLog(action, this.gameState.timeStep);
    }

    runSimulation(maxSteps = Infinity) {
        let loser = null;
        while (!loser && this.gameState.timeStep < maxSteps) {
            loser = this.processTimeStep();
        }

        //update end of game log
        this.logger.logEnd(new EndLog(this.gameState, loser));
        this.logger.updatePostGameData();

        //write logs to output directory
        this.logger.writeLogToFile();

        let results = {
            loser: loser,
            totalTimeSteps: this.gameState.timeStep,
            totalActions: this.gameState.totalPlayerActions
        }

        //TODO - this is so ugly; need to manage global state better
        //cleanup singletons, constant settings
        this.gameState.resetScalars();
        this.gameState.deleteSingletonInstance();
        this.logger.deleteSingletonInstance();

        return results;
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

    updateScalars(change) {
        //clamp to avoid insane scalar changes
        let clampedChange = change;
        //TODO: Is this allowing too sudden of changes?
        if (change >= 4) {
            clampedChange = 4;
        }

        if (change < .25) {
            clampedChange = .25;
        }

        //apply to damage
        Constants.SINGLE_TARGET_SCALAR = Utils.clamp(Constants.SINGLE_TARGET_SCALAR * clampedChange, Constants.MIN_SINGLE_TARGET_SCALAR, Constants.MAX_SINGLE_TARGET_SCALAR);
        Constants.MULTI_TARGET_SCALAR = Utils.clamp(Constants.MULTI_TARGET_SCALAR * clampedChange, Constants.MIN_MULTI_TARGET_SCALAR, Constants.MAX_MULTI_TARGET_SCALAR);
        //healing is inverse of damage
        Constants.HEAL_SCALAR = Utils.clamp(Constants.HEAL_SCALAR / clampedChange, Constants.MIN_HEAL_SCALAR, Constants.MAX_HEAL_SCALAR);
        Constants.MULTI_HEAL_SCALAR = Utils.clamp(Constants.MULTI_HEAL_SCALAR / clampedChange, Constants.MIN_MULTI_HEAL_SCALAR, Constants.MAX_MULTI_HEAL_SCALAR);
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