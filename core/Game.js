const RNG = require('../utils/RNG');
const Utils = require('../utils/Utils');
const Constants = require('../utils/Constants');

class Game {
    constructor(players, aiDirector, directorActionInterval = 9, actionExecutionInterval = 3) {
        this.players = players;
        this.aiDirector = aiDirector;
        this.actionQueue = [];
        this.timeStep = 0;
        this.log = []; // Initialize an empty log array to hold time step details
        this.directorActionInterval = directorActionInterval; // How often the director acts
        this.actionExecutionInterval = actionExecutionInterval; // How often actions are executed from the queue
        this.gameState = {

            prevTotalPlayerActions: 0,
            totalPlayerActions: 0,
            totalPlayerDamageOut: 0,
            actionCurrHPData: [],

            player1Data: {
                totalHP: 0,
                currentHP: 0,
                prevCurrentHP: 0, //used to calculate last turn's HP change
                hpRatio: 0,
                actions: 0,
                damageOut: 0,
                characterData: {
                    mage: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    warrior: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    priest: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    rogue: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    }
                }
            },
            player2Data: {
                totalHP: 0,
                currentHP: 0,
                prevCurrentHP: 0,
                hpRatio: 0,
                actions: 0,
                damageOut: 0,
                characterData: {
                    mage: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    warrior: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    priest: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    rogue: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    }
                }
            }
        };
        if (this.aiDirector) {
            this.aiDirector.gameState = this.gameState;
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


    enqueueAction(player, character) {
        if (!character.isAlive()) {
            return; // Skip enqueuing the action if the character is dead
        }

        const opponent = this.players.find(p => p !== player);
        const chosenAction = player.chooseAction(character, opponent.characters);
        if (!chosenAction) return;

        const targets = this.getTargets(character, chosenAction, opponent.characters, player.characters);
        this.actionQueue.push({
            character,
            chosenAction,
            targets,
            chosenAction
        });
    }

    processTurn() {
        this.timeStep++;

        // Remove dead characters from action queue - but only for character actions
        this.actionQueue = this.actionQueue.filter(action => {
            return action.character ? action.character.isAlive() : true; // Keep AI Director actions
        });

        // Initialize the actionsExecuted array
        let actionsExecutedThisTurn = [];

        // Capture the game state at this time step
        let stepLog = {
            timeStep: this.timeStep,
            actionsInQueue: this.actionQueue.map(action => {
                let actionDetails = {
                    player: action.character ? action.character.playerNumber : 'AI Director',
                    character: action.character ? action.character.name : 'AI Director',
                    actionType: action.chosenAction ? action.chosenAction.type : action.type,
                    targetDetails: action.targets ? action.targets.map(target => ({
                        playerNumber: target.playerNumber,
                        name: target.name
                    })) : [],
                };

                // Add AI Director specific details if it's an AI Director action
                if (action.type === 'buff' || action.type === 'nerf') {
                    actionDetails.targetPlayer = action.playerNum;
                    actionDetails.targetCharacter = action.targets;
                    actionDetails.statChanged = action.stats;
                    actionDetails.amountChanged = action.amount;
                }
                return actionDetails;
            }),
            actionsExecuted: actionsExecutedThisTurn,
            characters: this.players.flatMap(player => player.characters.map(character => ({
                player: character.playerNumber,
                name: character.name,
                currentHP: character.stats.currentHP,
                stats: {...character.stats
                }, // Capture all stats
                baseStats: {...character.baseStats
                }
            }))),
            queueLength: this.actionQueue.length,
            gameState: {}
        };

        this.players.forEach(player => {
            player.characters.forEach(character => {
                if (character.isAlive()) {
                    character.addActionPoints();
                    if (character.actionBar >= 100) {
                        this.enqueueAction(player, character);
                        character.resetActionBar();
                        character.resetDefense(); // Reset defense after the turn, but not AI buffs
                    }
                }
            });
        });

        // Balance the game every n=directorActionInterval steps
        if (this.timeStep % this.directorActionInterval === 0 && this.aiDirector) {
            let directorAction = this.aiDirector.balanceGame(this.players, this.log, this.timeStep, this.actionQueue);
            console.log("REACHED BALANCING OPERATION");
            if(directorAction){
                this.executeAIDirectorAction(directorAction, stepLog);
            }
        }

        //before executing actions, save previous turn's number of actions
        this.gameState.prevTotalPlayerActions = this.gameState.totalPlayerActions;

        // Execute Actions for turn
        if (this.timeStep % this.actionExecutionInterval === 0 && this.actionQueue.length > 0) {
            let action = this.actionQueue.shift();

            if (action.type === 'buff' || action.type === 'nerf' || action.type === 'heal' || action.type === 'damage') {
            //    this.executeAIDirectorAction(action, stepLog); // Handle AI Director actions
            } else {
                this.executeAction(action, stepLog); // Handle character actions
                const currentTotalHP = this.gameState.player1Data.currentHP + this.gameState.player2Data.currentHP;
                this.gameState.actionCurrHPData.push([this.gameState.totalPlayerActions, currentTotalHP]); //update based on array
            }
        }



        //update useful player data stats

        //Set HP Ratios
        //variables for player HP ratio
        let totalPlayer1HP = 0;
        let currentPlayer1HP = 0;
        let totalPlayer2HP = 0;
        let currentPlayer2HP = 0;

        //Update prevCurrentHP before updating currentHP
        this.gameState.player1Data.prevCurrentHP = this.gameState.player1Data.currentHP;
        this.gameState.player2Data.prevCurrentHP = this.gameState.player2Data.currentHP;

        //TODO: Fix this data access, logging implementation was bad...
        if (stepLog.characters) {
            for (let character of stepLog.characters) {
                if (character.player == 1) {
                    totalPlayer1HP += character.stats.HP;
                    currentPlayer1HP += character.currentHP;

                    switch (character.name) {
                        case 'warrior':
                            {
                                this.gameState.player1Data.characterData.warrior.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'mage':
                            {
                                this.gameState.player1Data.characterData.mage.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'priest':
                            {
                                this.gameState.player1Data.characterData.priest.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'rogue':
                            {
                                this.gameState.player1Data.characterData.rogue.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        default:
                            {
                                break
                            }
                    }

                } else {
                    totalPlayer2HP += character.stats.HP;
                    currentPlayer2HP += character.currentHP;
                    switch (character.name) {
                        case 'warrior':
                            {
                                this.gameState.player2Data.characterData.warrior.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'mage':
                            {
                                this.gameState.player2Data.characterData.mage.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'priest':
                            {
                                this.gameState.player2Data.characterData.priest.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'rogue':
                            {
                                this.gameState.player2Data.characterData.rogue.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        default:
                            {
                                break
                            }
                    }

                }
                this.gameState.player1Data.totalHP = totalPlayer1HP;
                this.gameState.player1Data.currentHP = currentPlayer1HP;
                this.gameState.player2Data.totalHP = totalPlayer2HP;
                this.gameState.player2Data.currentHP = currentPlayer2HP;
            }
        }

        //Player1 Ratios
        this.gameState.player1Data.characterData.mage.damageRatio = Utils.safeDivide(this.gameState.player1Data.characterData.mage.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player1Data.characterData.mage.actionRatio = Utils.safeDivide(this.gameState.player1Data.characterData.mage.actions, this.gameState.totalPlayerActions);

        this.gameState.player1Data.characterData.warrior.damageRatio = Utils.safeDivide(this.gameState.player1Data.characterData.warrior.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player1Data.characterData.warrior.actionRatio = Utils.safeDivide(this.gameState.player1Data.characterData.warrior.actions, this.gameState.totalPlayerActions);

        this.gameState.player1Data.characterData.priest.damageRatio = Utils.safeDivide(this.gameState.player1Data.characterData.priest.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player1Data.characterData.priest.actionRatio = Utils.safeDivide(this.gameState.player1Data.characterData.priest.actions, this.gameState.totalPlayerActions);

        this.gameState.player1Data.characterData.rogue.damageRatio = Utils.safeDivide(this.gameState.player1Data.characterData.rogue.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player1Data.characterData.rogue.actionRatio = Utils.safeDivide(this.gameState.player1Data.characterData.rogue.actions, this.gameState.totalPlayerActions);

        //Player2 Ratios
        this.gameState.player2Data.characterData.mage.damageRatio = Utils.safeDivide(this.gameState.player2Data.characterData.mage.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player2Data.characterData.mage.actionRatio = Utils.safeDivide(this.gameState.player2Data.characterData.mage.actions, this.gameState.totalPlayerActions);

        this.gameState.player2Data.characterData.warrior.damageRatio = Utils.safeDivide(this.gameState.player2Data.characterData.warrior.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player2Data.characterData.warrior.actionRatio = Utils.safeDivide(this.gameState.player2Data.characterData.warrior.actions, this.gameState.totalPlayerActions);

        this.gameState.player2Data.characterData.priest.damageRatio = Utils.safeDivide(this.gameState.player2Data.characterData.priest.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player2Data.characterData.priest.actionRatio = Utils.safeDivide(this.gameState.player2Data.characterData.priest.actions, this.gameState.totalPlayerActions);

        this.gameState.player2Data.characterData.rogue.damageRatio = Utils.safeDivide(this.gameState.player2Data.characterData.rogue.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player2Data.characterData.rogue.actionRatio = Utils.safeDivide(this.gameState.player2Data.characterData.rogue.actions, this.gameState.totalPlayerActions);

        //Player HP Ratios
        this.gameState.player1Data.hpRatio = currentPlayer1HP / totalPlayer1HP;
        this.gameState.player2Data.hpRatio = currentPlayer2HP / totalPlayer2HP;



        //update gameState with new changes from turn simulation
        stepLog.gameState = structuredClone(this.gameState);

        // Push the time step log to the main log array
        this.log.push(stepLog);
    }

    executeAction({
            character,
            chosenAction,
            targets
        }, stepLog) {
            // Filter out dead targets
            const aliveTargets = targets.filter(target => target.isAlive());

            if (aliveTargets.length === 0 && chosenAction.type !== 'defend') {
                return; // If there are no alive targets, skip this action entirely
            }

            //update data for actions taken
            this.gameState.totalPlayerActions++;
            if (character.playerNumber === 1) {
                this.gameState.player1Data.actions++;
                switch (character.name) {
                    case 'warrior':
                        {
                            this.gameState.player1Data.characterData.warrior.actions++;
                            break
                        }
                    case 'mage':
                        {
                            this.gameState.player1Data.characterData.mage.actions++;
                            break
                        }
                    case 'priest':
                        {
                            this.gameState.player1Data.characterData.priest.actions++;
                            break
                        }
                    case 'rogue':
                        {
                            this.gameState.player1Data.characterData.rogue.actions++;
                            break
                        }
                    default:
                        {
                            break
                        }
                }
            } else {
                this.gameState.player2Data.actions++;
                switch (character.name) {
                    case 'warrior':
                        {
                            this.gameState.player2Data.characterData.warrior.actions++;
                            break
                        }
                    case 'mage':
                        {
                            this.gameState.player2Data.characterData.mage.actions++;
                            break
                        }
                    case 'priest':
                        {
                            this.gameState.player2Data.characterData.priest.actions++;
                            break
                        }
                    case 'rogue':
                        {
                            this.gameState.player2Data.characterData.rogue.actions++;
                            break
                        }
                    default:
                        {
                            break
                        }
                }
            }

            let actionDescription = `[Time Step: ${this.timeStep}] ${character.name} from player ${character.playerNumber} is using ${chosenAction.type}`;
            let targetString = aliveTargets.map(target => `${target.playerNumber} - ${target.name}`).join(", ");
            let damage = 0;
            let healAmount = 0;
            let attackingStat = 0;
            let defendingStat = 0;
            let minAttack = 0; // Initialize
            let minDefense = 0; // Initialize
            let avgDef = 0; // Initialize
            let minHeal = 0; // Initialize
            let avgMultiDef = 0; // Initialize
            let minMultiHeal = 0; // Initialize
            let rawDamage = 0; // Initialize
            let rawHeal = 0;
            let preScalarHeal = 0;
            const defeatedCharacters = []; // Keep track of defeated characters in this action

            //TODO: Convert to constants or parameters defined by character's highest HP value.
            let minHPChange = 1;
            let maxHPChange = 65;

            //TODO: Calculate constants for clamp values ahead of time instead of hardcoding below
            let minClamp = 0;
            let maxClamp = 0;

            switch (chosenAction.type) {
                case 'attack':
                    // 1. Determine minimum possible attack: stat - (stat * (1-luck/100))
                    minAttack = character.stats.Attack - (character.stats.Attack * (1 - character.stats.Luck / 100));
                    // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                    attackingStat = minAttack + this.getRandom() * (character.stats.Attack - minAttack);

                    // 1. Determine minimum possible defense: stat - (stat * (1-luck/100))
                    minDefense = targets[0].stats.Defense - (targets[0].stats.Defense * (1 - targets[0].stats.Luck / 100));
                    // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                    defendingStat = minDefense + this.getRandom() * (targets[0].stats.Defense - minDefense);

                    // Calculate raw damage, clamp, and map to the 1-65 range
                    rawDamage = (attackingStat - defendingStat);

                    //min val - -90, if atk = 10 and def = 100; max val - 90, if atk = 100 and def = 10
                    minClamp = -90;
                    maxClamp = 90;

                    rawDamage = Math.max(minClamp, Math.min(maxClamp, rawDamage)); // Clamp between -90 and 90

                    damage = (Utils.map(rawDamage, minClamp, maxClamp, minHPChange, maxHPChange)) * Constants.SINGLE_TARGET_SCALAR; // Map to 1-65

                    targets[0].takeDamage(Math.floor(damage));
                    actionDescription += ` dealing ${Math.floor(damage)} damage to ${targets[0].name} from player ${targets[0].playerNumber}`;

                    this.gameState.totalPlayerDamageOut += damage;
                    if (character.playerNumber === 1) {
                        this.gameState.player1Data.damageOut += damage;
                        switch (character.name) {
                            case 'warrior':
                                {
                                    this.gameState.player1Data.characterData.warrior.damageOut += damage;
                                    break
                                }
                            case 'mage':
                                {
                                    this.gameState.player1Data.characterData.mage.damageOut += damage;
                                    break
                                }
                            case 'priest':
                                {
                                    this.gameState.player1Data.characterData.priest.damageOut += damage;
                                    break
                                }
                            case 'rogue':
                                {
                                    this.gameState.player1Data.characterData.rogue.damageOut += damage;
                                    break
                                }
                            default:
                                {
                                    break
                                }
                        }
                    } else {
                        this.gameState.player2Data.damageOut += damage;
                        switch (character.name) {
                            case 'warrior':
                                {
                                    this.gameState.player2Data.characterData.warrior.damageOut += damage;
                                    break
                                }
                            case 'mage':
                                {
                                    this.gameState.player2Data.characterData.mage.damageOut += damage;
                                    break
                                }
                            case 'priest':
                                {
                                    this.gameState.player2Data.characterData.priest.damageOut += damage;
                                    break
                                }
                            case 'rogue':
                                {
                                    this.gameState.player2Data.characterData.rogue.damageOut += damage;
                                    break
                                }
                            default:
                                {
                                    break
                                }
                        }
                    }

                    break;
                case 'multi_attack':
                    {
                        const damagedTargetNames = aliveTargets.map(target => `${target.name} from player ${target.playerNumber}`);
                        let damageDetails = []; // Array to hold damage details for each target
                        let totalDamage = 0; // Initialize to zero

                        for (const target of aliveTargets) {
                            // 1. Determine minimum possible attack: stat - (stat * (1-luck/100))
                            let minAttack = character.stats.Attack - (character.stats.Attack * (1 - character.stats.Luck / 100));
                            // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                            let attackingStat = minAttack + this.getRandom() * (character.stats.Attack - minAttack);

                            // 1. Determine minimum possible defense: stat - (stat * (1-luck/100))
                            let minDefense = target.stats.Defense - (target.stats.Defense * (1 - target.stats.Luck / 100));
                            // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                            let defendingStat = minDefense + this.getRandom() * (target.stats.Defense - minDefense);

                            // Calculate raw damage, clamp, and map to the 1-65 range
                            let rawDamage = (attackingStat - defendingStat);
                            //min val - -90, if atk = 10 and def = 100; max val - 90, if atk = 100 and def = 10
                            minClamp = -90;
                            maxClamp = 90;
                            rawDamage = Math.max(minClamp, Math.min(maxClamp, rawDamage)); // Clamp between -90 and 90

                            let damage = (Utils.map(rawDamage, minClamp, maxClamp, 1, 65)); // Map to 1-65

                            let dmg = Math.floor(damage) * Constants.MULTI_TARGET_SCALAR;

                            target.takeDamage(dmg);

                            damageDetails.push({
                                target: target.name,
                                damage: dmg
                            });
                            totalDamage += dmg;
                        }

                        this.gameState.totalPlayerDamageOut += totalDamage;
                        if (character.playerNumber === 1) {
                            this.gameState.player1Data.damageOut += totalDamage;
                            switch (character.name) {
                                case 'warrior':
                                    {
                                        this.gameState.player1Data.characterData.warrior.damageOut += totalDamage;
                                        break
                                    }
                                case 'mage':
                                    {
                                        this.gameState.player1Data.characterData.mage.damageOut += totalDamage;
                                        break
                                    }
                                case 'priest':
                                    {
                                        this.gameState.player1Data.characterData.priest.damageOut += totalDamage;
                                        break
                                    }
                                case 'rogue':
                                    {
                                        this.gameState.player1Data.characterData.rogue.damageOut += totalDamage;
                                        break
                                    }
                                default:
                                    {
                                        break
                                    }
                            }
                        } else {
                            this.gameState.player2Data.damageOut += totalDamage;
                            switch (character.name) {
                                case 'warrior':
                                    {
                                        this.gameState.player2Data.characterData.warrior.damageOut += totalDamage;
                                        break
                                    }
                                case 'mage':
                                    {
                                        this.gameState.player2Data.characterData.mage.damageOut += totalDamage;
                                        break
                                    }
                                case 'priest':
                                    {
                                        this.gameState.player2Data.characterData.priest.damageOut += totalDamage;
                                        break
                                    }
                                case 'rogue':
                                    {
                                        this.gameState.player2Data.characterData.rogue.damageOut += totalDamage;
                                        break
                                    }
                                default:
                                    {
                                        break
                                    }
                            }
                        }

                        actionDescription = `[Time Step: ${this.timeStep}] ${character.name} from player ${character.playerNumber} is using multi_attack, dealing damage to ${aliveTargets.map(target => `${target.name} (${damageDetails.find(d => d.target === target.name).damage})`).join(', ')}`;
                    break;
                }
            case 'magic_attack':
                // 1. Determine minimum possible attack: stat - (stat * (1-luck/100))
                minAttack = character.stats.MagicAttack - (character.stats.MagicAttack * (1 - character.stats.Luck / 100));
                // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                attackingStat = minAttack + this.getRandom() * (character.stats.MagicAttack - minAttack);

                // 1. Determine minimum possible defense: stat - (stat * (1-luck/100))
                minDefense = targets[0].stats.MagicDefense - (targets[0].stats.MagicDefense * (1 - targets[0].stats.Luck / 100));
                // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                defendingStat = minDefense + this.getRandom() * (targets[0].stats.MagicDefense - minDefense);

                // Calculate raw damage, clamp, and map to the 1-65 range
                rawDamage = (attackingStat - defendingStat);

                minClamp = -90;
                maxClamp = 90;

                rawDamage = Math.max(minClamp, Math.min(maxClamp, rawDamage)); // Clamp between -90 and 90

                damage = (Utils.map(rawDamage, minClamp, maxClamp, minHPChange, maxHPChange)) * Constants.SINGLE_TARGET_SCALAR; // Map to 1-65

                targets[0].takeDamage(Math.floor(damage));
                actionDescription += ` dealing ${Math.floor(damage)} damage to ${targets[0].name} from player ${targets[0].playerNumber}`;

                this.gameState.totalPlayerDamageOut += damage;
                if (character.playerNumber === 1) {
                    this.gameState.player1Data.damageOut += damage;
                    switch (character.name) {
                        case 'warrior': {
                            this.gameState.player1Data.characterData.warrior.damageOut += damage;
                            break
                        }
                        case  'mage': {
                            this.gameState.player1Data.characterData.mage.damageOut += damage;
                            break
                        }
                        case  'priest': {
                            this.gameState.player1Data.characterData.priest.damageOut += damage;
                            break
                        }
                        case  'rogue': {
                            this.gameState.player1Data.characterData.rogue.damageOut += damage;
                            break
                        }
                        default: {
                            break
                        }
                    }
                } else {
                    this.gameState.player2Data.damageOut += damage;
                    switch (character.name) {
                        case 'warrior': {
                            this.gameState.player2Data.characterData.warrior.damageOut += damage;
                            break
                        }
                        case  'mage': {
                            this.gameState.player2Data.characterData.mage.damageOut += damage;
                            break
                        }
                        case  'priest': {
                            this.gameState.player2Data.characterData.priest.damageOut += damage;
                            break
                        }
                        case  'rogue': {
                            this.gameState.player2Data.characterData.rogue.damageOut += damage;
                            break
                        }
                        default: {
                            break
                        }
                    }
                }
                break;
            case 'multi_magic_attack':
                {
                    const damagedTargetNames = aliveTargets.map(target => `${target.name} from player ${target.playerNumber}`);
                    let damageDetails = []; // Array to hold damage details for each target
                    let totalDamage = 0; // Initialize to zero

                    for (const target of aliveTargets) {
                        // 1. Determine minimum possible attack: stat - (stat * (1-luck/100))
                        let minAttack = character.stats.MagicAttack - (character.stats.MagicAttack * (1 - character.stats.Luck / 100));
                        // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                        let attackingStat = minAttack + this.getRandom() * (character.stats.MagicAttack - minAttack);

                        // 1. Determine minimum possible defense: stat - (stat * (1-luck/100))
                        let minDefense = target.stats.MagicDefense - (target.stats.MagicDefense * (1 - target.stats.Luck / 100));
                        // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                        let defendingStat = minDefense + this.getRandom() * (target.stats.MagicDefense - minDefense);

                        // Calculate raw damage, clamp, and map to the 1-65 range
                        let rawDamage = (attackingStat - defendingStat);
                        //min val - -90, if atk = 10 and def = 100; max val - 90, if atk = 100 and def = 10
                        minClamp = -90;
                        maxClamp = 90;

                        rawDamage = Math.max(minClamp, Math.min(maxClamp, rawDamage)); // Clamp between -90 and 90

                        let damage = (Utils.map(rawDamage, minClamp, maxClamp, 1, 65)); // Map to 1-65
                        let dmg = Math.floor(damage) * Constants.MULTI_TARGET_SCALAR;
                        target.takeDamage(dmg);

                        damageDetails.push({
                            target: target.name,
                            damage: dmg
                        });
                        totalDamage += dmg;
                    }

                    this.gameState.totalPlayerDamageOut += totalDamage;
                    if (character.playerNumber === 1) {
                        this.gameState.player1Data.damageOut += totalDamage;
                        switch (character.name) {
                            case 'warrior': {
                                this.gameState.player1Data.characterData.warrior.damageOut += totalDamage;
                                break
                            }
                            case  'mage': {
                                this.gameState.player1Data.characterData.mage.damageOut += totalDamage;
                                break
                            }
                            case  'priest': {
                                this.gameState.player1Data.characterData.priest.damageOut += totalDamage;
                                break
                            }
                            case  'rogue': {
                                this.gameState.player1Data.characterData.rogue.damageOut += totalDamage;
                                break
                            }
                            default: {
                                break
                            }
                        }
                    } else {
                        this.gameState.player2Data.damageOut += totalDamage;
                        switch (character.name) {
                            case 'warrior': {
                                this.gameState.player2Data.characterData.warrior.damageOut += totalDamage;
                                break
                            }
                            case  'mage': {
                                this.gameState.player2Data.characterData.mage.damageOut += totalDamage;
                                break
                            }
                            case  'priest': {
                                this.gameState.player2Data.characterData.priest.damageOut += totalDamage;
                                break
                            }
                            case  'rogue': {
                                this.gameState.player2Data.characterData.rogue.damageOut += totalDamage;
                                break
                            }
                            default: {
                                break
                            }
                        }
                    }

                    actionDescription = `[Time Step: ${this.timeStep}] ${character.name} from player ${character.playerNumber} is using multi_magic_attack, dealing damage to ${aliveTargets.map(target => `${target.name} (${damageDetails.find(d => d.target === target.name).damage})`).join(', ')}`;
                break;
            }
            case 'heal':
                // 1. Determine average defense
                avgDef = (character.stats.MagicDefense + character.stats.Defense) / 2;
                // 2. Calculate minimum possible heal based on luck
                minHeal = avgDef * (character.stats.Luck / 100);
                // 3. randomly pick (based off of game seed) a value between minimum possible heal and average defense, tune against scalar
                rawHeal = (minHeal + this.getRandom() * (avgDef - minHeal)) * Constants.HEAL_SCALAR;
                // 4. clamp values

                minClamp = 10 * Constants.HEAL_SCALAR;
                maxClamp = 100 * Constants.HEAL_SCALAR;

                rawHeal = Math.max(minClamp, Math.min(maxClamp, rawHeal)); // clamp between 0 and 80
                // 5. map values
                healAmount = Utils.map(rawHeal, minClamp, maxClamp, minHPChange, maxHPChange);
                healAmount = Math.floor(healAmount);
                targets[0].heal(healAmount);
                actionDescription += ` healing ${targets[0].name} from player ${targets[0].playerNumber} for ${healAmount} health`;
                break;
            case 'multi_heal':
                {
                    // 1. Determine average defense
                    avgDef = (character.stats.MagicDefense + character.stats.Defense) / 2;
                    // 2. Calculate minimum possible heal based on luck
                    minHeal = avgDef * (character.stats.Luck / 100);
                    // 3. randomly pick (based off of game seed) a value between minimum possible heal and average defense
                    rawHeal = (minHeal + this.getRandom() * (avgDef - minHeal)) * Constants.MULTI_HEAL_SCALAR;

                    minClamp = 10 * Constants.MULTI_HEAL_SCALAR;
                    maxClamp = 100 * Constants.MULTI_HEAL_SCALAR;

                    // 4. clamp values
                    rawHeal = Math.max(minClamp, Math.min(maxClamp, rawHeal)); // clamp between 0 and 80
                    // 5. map values
                    healAmount = Utils.map(rawHeal, minClamp, maxClamp, minHPChange, maxHPChange);
                    healAmount = Math.floor(healAmount);

                    const healedTargetNames = aliveTargets.map(target => `${target.name} from player ${target.playerNumber}`);
                    actionDescription = `[Time Step: ${this.timeStep}] ${character.name} from player ${character.playerNumber} is using multi_heal, multi-healing  ${healedTargetNames.join(', ')} for ${healAmount} health each`;
                    aliveTargets.forEach(target => target.heal(healAmount));
                    break;
                }
            case 'defend':
                character.applyDefenseBoost();
                actionDescription += ` defending`;
                break;
        }

        console.log(actionDescription);

        // Log the executed action for this step
        const actionDetails = {
            player: character.playerNumber,
            character: character.name,
            actionType: chosenAction.type,
            targets: aliveTargets.map(target => `${target.playerNumber} - ${target.name}`),
            damageDealt: damage,
            healAmount: healAmount
        };
        stepLog.actionsExecuted.push(actionDetails);

        aliveTargets.forEach(target => {
            if (!target.isAlive()) {
                defeatedCharacters.push(target);
            }
        });

        defeatedCharacters.forEach(target => {
            console.log(`${target.name} from player ${target.playerNumber} has been defeated!`);
        });
        stepLog.actionsExecuted.push(actionDetails);
    }

    getTargets(character, chosenAction, opponents, allies) {
        let target = null;
        if (chosenAction.type === 'heal') {
            // Heal should target only one ally, including the character itself
            let validHealTargets = allies.filter(c => c.isAlive());

            //The chooseTarget function from the player AI is used to determine the best target
            target = character.player.chooseTarget(chosenAction, character, [], validHealTargets);

            if (target) {
                return [target];
            } else {
                return [];
            }
        } else if (chosenAction.type === 'multi_heal') {
            // Multi-heal should target all allies, including the character itself
            return allies.filter(c => c.isAlive());
        } else {
            // Other actions (attack, magic) target opponents
            if (chosenAction.multiTarget) {
                return opponents.filter(c => c.isAlive());
            } else {
                let aliveOpponents = opponents.filter(c => c.isAlive()); // ADDED THIS LINE
                target = character.player.chooseTarget(chosenAction, character, aliveOpponents, allies); // EDITED THIS LINE
                if (target) {
                    return [target];
                } else {
                    return [];
                }
            }
        }
    }

    executeAIDirectorAction(action, stepLog) {
        let {
            type,
            targets,
            stats,
            amount,
            playerNum
        } = action;
        let actionDescription = `[Time Step: ${this.timeStep}] AI Director is using ${type} on ${targets} from player ${playerNum}`;

        if (type === 'buff') {
            for (let target of targets) {
                for (let stat of stats) {
                    target.baseStats[stat] += amount;
                    target.stats[stat] += amount;
                    target.stats[stat] = Math.min(100, Math.max(10, target.stats[stat])); // Cap Stats
                    actionDescription += ` buffing ${stat} by ${amount}. New value: ${target.stats[stat]}`;
                }
            }
        } else if (type === 'nerf') {
            for (let target of targets) {
                for (let stat of stats) {
                    target.baseStats[stat] -= amount;
                    target.stats[stat] -= amount;
                    target.stats[stat] = Math.max(10, Math.min(100, target.stats[stat])); // Floor stats
                    actionDescription += ` nerfing ${stat} by ${amount}. New value: ${target.stats[stat]}`;
                }
            }
        } else if (type === 'heal') {
            for (let target of targets) {
                target.stats['currentHP'] += amount;
                target.stats['currentHP'] = Math.min(target.baseStats['HP'], target.stats['currentHP']);
                actionDescription += ` healing 'currentHP' by ${amount}. New value: ${target.stats['currentHP']}`;
            }
        } else if (type === 'damage') {
            for (let target of targets) {
                target.stats['currentHP'] -= amount;
                target.stats['currentHP'] = Math.max(0, target.stats['currentHP']);
                actionDescription += ` damaging 'currentHP' by ${amount}. New value: ${target.stats['currentHP']}`;
            }
        }
        console.log(actionDescription);

        // Log the executed action for this step
        const actionDetails = {
            player: 'AI Director',
            character: targets,
            actionType: type,
            playerNum: playerNum,
            statChanged: stats,
            amountChanged: amount
        };
        stepLog.actionsExecuted.push(actionDetails);
    }

    runSimulation(maxSteps = Infinity) {
        let winner = null;
        while (!winner && this.timeStep < maxSteps) {
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

    getRandom() {
        return RNG.next(); // Use the seeded RNG for any random value
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
}

module.exports = Game;