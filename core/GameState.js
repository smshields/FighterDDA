/**
 * TODO - REFACTORING:
 * - incrementPlayerXActions should be one function that takes a playerNumber parameter.
 * */

const Constants = require('../utils/Constants');
const Utils = require('../utils/Utils');
const Logger = require('../logging/Logger');

class GameState {

    constructor(players, directorActionInterval, actionExecutionInterval) {

        //Singleton
        if (GameState.instance) {
            return GameState.instance;
        } else {
            GameState.instance = this;
        }

        this.logger = new Logger();

        this.actionQueue = [];
        this.timeStep = 0;

        this.directorActionInterval = directorActionInterval;
        this.actionExecutionInterval = actionExecutionInterval;

        this.prevTotalPlayerActions = 0;
        this.totalPlayerActions = 0;

        this.totalPlayerDamageOut = 0;
        this.totalHealOut = 0;

        //[actions, p1HP, p2HP, totalHP]
        this.actionCurrHPData = [];

        this.totalHP = 0;
        this.currentHP = 0;
        this.prevCurrentHP = 0;

        this.player1Data = {
            totalHP: 0,
            currentHP: 0,
            prevCurrentHP: 0, //used to calculate last turn's HP change
            hpRatio: 0,
            actions: 0,
            damageOut: 0,
            damageIn: 0,
            healOut: 0,
            characterData: {
                mage: {
                    damageOut: 0,
                    actions: 0,
                    damageOutRatio: 0,
                    damageInRatio: 0,
                    actionRatio: 0,
                    hpRatio: 0,
                    damageIn: 0,
                    healOut: 0,
                    healIn: 0,
                    stats: {}
                },
                warrior: {
                    damageOut: 0,
                    actions: 0,
                    damageOutRatio: 0,
                    damageInRatio: 0,
                    actionRatio: 0,
                    hpRatio: 0,
                    damageIn: 0,
                    healOut: 0,
                    healIn: 0,
                    stats: {}
                },
                priest: {
                    damageOut: 0,
                    actions: 0,
                    damageOutRatio: 0,
                    damageInRatio: 0,
                    actionRatio: 0,
                    hpRatio: 0,
                    damageIn: 0,
                    healOut: 0,
                    healIn: 0,
                    stats: {}
                },
                rogue: {
                    damageOut: 0,
                    actions: 0,
                    damageOutRatio: 0,
                    damageInRatio: 0,
                    actionRatio: 0,
                    hpRatio: 0,
                    damageIn: 0,
                    healOut: 0,
                    healIn: 0,
                    stats: {}
                }
            }
        };

        this.player2Data = {
            totalHP: 0,
            currentHP: 0,
            prevCurrentHP: 0,
            hpRatio: 0,
            actions: 0,
            damageOut: 0,
            damageIn: 0,
            healOut: 0,
            characterData: {
                mage: {
                    damageOut: 0,
                    actions: 0,
                    damageOutRatio: 0,
                    damageInRatio: 0,
                    actionRatio: 0,
                    hpRatio: 0,
                    damageIn: 0,
                    healOut: 0,
                    healIn: 0,
                    stats: {}
                },
                warrior: {
                    damageOut: 0,
                    actions: 0,
                    damageOutRatio: 0,
                    damageInRatio: 0,
                    actionRatio: 0,
                    hpRatio: 0,
                    damageIn: 0,
                    healOut: 0,
                    healIn: 0,
                    stats: {}
                },
                priest: {
                    damageOut: 0,
                    actions: 0,
                    damageOutRatio: 0,
                    damageInRatio: 0,
                    actionRatio: 0,
                    hpRatio: 0,
                    damageIn: 0,
                    healOut: 0,
                    healIn: 0,
                    stats: {}
                },
                rogue: {
                    damageOut: 0,
                    actions: 0,
                    damageOutRatio: 0,
                    damageInRatio: 0,
                    actionRatio: 0,
                    hpRatio: 0,
                    damageIn: 0,
                    healOut: 0,
                    healIn: 0,
                    stats: {}
                }
            }
        }
    }

    initPlayer1Data(totalHP, characters) {
        this.player1Data.totalHP = totalHP;
        this.player1Data.currentHP = totalHP;
        this.player1Data.prevCurrentHP = totalHP;
        this.player1Data.hpRatio = this.player1Data.currentHP / this.player1Data.totalHP;

        //All characters start with full HP.
        this.player1Data.characterData.warrior.hpRatio = 1;
        this.player1Data.characterData.mage.hpRatio = 1;
        this.player1Data.characterData.priest.hpRatio = 1;
        this.player1Data.characterData.rogue.hpRatio = 1;

        //Set initial character stats
        for (let character of characters) {
            switch (character.name) {
                case Constants.WARRIOR_NAME:
                    {
                        this.player1Data.characterData.warrior.stats = character.stats;
                        break;
                    }
                case Constants.MAGE_NAME:
                    {
                        this.player1Data.characterData.mage.stats = character.stats;
                        break;
                    }
                case Constants.PRIEST_NAME:
                    {
                        this.player1Data.characterData.priest.stats = character.stats;
                        break;
                    }
                case Constants.ROGUE_NAME:
                    {
                        this.player1Data.characterData.rogue.stats = character.stats;
                        break;
                    }
                default:
                    {
                        this.logger.logError("GameState - initPlayer1Data: Incorrect name of character when setting stats!");
                        break;
                    }
            }
        }

        //manage global HP tracking
        this.totalHP += totalHP;
        this.currentHP += totalHP;
        this.prevCurrentHP += totalHP;
    }

    initPlayer2Data(totalHP, characters) {
        this.player2Data.totalHP = totalHP;
        this.player2Data.currentHP = totalHP;
        this.player2Data.prevCurrentHP = totalHP;
        this.player2Data.hpRatio = this.player2Data.currentHP / this.player2Data.totalHP;

        //All characters start with full HP.
        this.player2Data.characterData.warrior.hpRatio = 1;
        this.player2Data.characterData.mage.hpRatio = 1;
        this.player2Data.characterData.priest.hpRatio = 1;
        this.player2Data.characterData.rogue.hpRatio = 1;

        //Set initial character stats
        for (let character of characters) {
            switch (character.name) {
                case Constants.WARRIOR_NAME:
                    {
                        this.player2Data.characterData.warrior.stats = character.stats;
                        break;
                    }
                case Constants.MAGE_NAME:
                    {
                        this.player2Data.characterData.mage.stats = character.stats;
                        break;
                    }
                case Constants.PRIEST_NAME:
                    {
                        this.player2Data.characterData.priest.stats = character.stats;
                        break;
                    }
                case Constants.ROGUE_NAME:
                    {
                        this.player2Data.characterData.rogue.stats = character.stats;
                        break;
                    }
                default:
                    {
                        this.logger.logError("GameState - initPlayer2Data: Incorrect name of character when setting stats!");
                        break;
                    }
            }
        }

        //manage globalHP tracking
        this.totalHP += totalHP;
        this.currentHP += totalHP;
        this.prevCurrentHP += totalHP;
    }

    updatePlayer1Data(player) {
        let totalHP = 0;
        let prevCurrentHP = this.player1Data.currentHP;
        let currentHP = 0;
        let hpRatio = 0;

        //console.log(player.characters);

        for (let character of player.characters) {
            totalHP += character.baseStats.HP;
            currentHP += character.stats.currentHP;
            this.player1Data.characterData[character.name].stats = character.stats;
        }

        hpRatio = currentHP / totalHP;

        this.player1Data.totalHP = totalHP;
        this.player1Data.prevCurrentHP = prevCurrentHP;
        this.player1Data.currentHP = currentHP;
        this.player1Data.hpRatio = hpRatio;

    }

    updatePlayer2Data(player) {
        let totalHP = 0;
        let prevCurrentHP = this.player2Data.currentHP;
        let currentHP = 0;
        let hpRatio = 0;

        for (let character of player.characters) {
            totalHP += character.baseStats.HP;
            currentHP += character.stats.currentHP;
            this.player2Data.characterData[character.name].stats = character.stats;

        }

        hpRatio = currentHP / totalHP;

        this.player2Data.totalHP = totalHP;
        this.player2Data.prevCurrentHP = prevCurrentHP;
        this.player2Data.currentHP = currentHP;
        this.player2Data.hpRatio = hpRatio;
    }

    updateTotalHP(players) {
        this.prevCurrentHP = this.currentHP;
        this.totalHP = this.player1Data.totalHP + this.player2Data.totalHP;
        this.currentHP = this.player1Data.currentHP + this.player2Data.currentHP;
    }

    incrementTotalPlayerActions() {
        this.totalPlayerActions++;
    }

    incrementPlayer1CharacterAction(character) {
        this.player1Data.actions++;
        switch (character.name) {
            case Constants.WARRIOR_NAME:
                {
                    this.player1Data.characterData.warrior.actions++;
                    this.player1Data.characterData.warrior.actionRatio = Utils.round(this.player1Data.characterData.warrior.actions / this.totalPlayerActions, 2);
                    break
                }
            case Constants.MAGE_NAME:
                {
                    this.player1Data.characterData.mage.actions++;
                    this.player1Data.characterData.mage.actionRatio = Utils.round(this.player1Data.characterData.mage.actions / this.totalPlayerActions, 2);
                    break
                }
            case Constants.PRIEST_NAME:
                {
                    this.player1Data.characterData.priest.actions++;
                    this.player1Data.characterData.priest.actionRatio = Utils.round(this.player1Data.characterData.priest.actions / this.totalPlayerActions, 2);
                    break
                }
            case Constants.ROGUE_NAME:
                {
                    this.player1Data.characterData.rogue.actions++;
                    this.player1Data.characterData.rogue.actionRatio = Utils.round(this.player1Data.characterData.rogue.actions / this.totalPlayerActions, 2);
                    break
                }
            default:
                {
                    this.logger.logError(`Invalid character for player 1 specified for action tracking: ${character.name}`);
                    break
                }
        }
    }

    incrementPlayer2CharacterAction(character) {
        this.player2Data.actions++;
        switch (character.name) {
            case Constants.WARRIOR_NAME:
                {
                    this.player2Data.characterData.warrior.actions++;
                    this.player2Data.characterData.warrior.actionRatio = Utils.round(this.player2Data.characterData.warrior.actions / this.totalPlayerActions, 2);
                    break
                }
            case Constants.MAGE_NAME:
                {
                    this.player2Data.characterData.mage.actions++;
                    this.player2Data.characterData.mage.actionRatio = Utils.round(this.player2Data.characterData.mage.actions / this.totalPlayerActions, 2);
                    break
                }
            case Constants.PRIEST_NAME:
                {
                    this.player2Data.characterData.priest.actions++;
                    this.player2Data.characterData.priest.actionRatio = Utils.round(this.player2Data.characterData.priest.actions / this.totalPlayerActions, 2);
                    break
                }
            case Constants.ROGUE_NAME:
                {
                    this.player2Data.characterData.rogue.actions++;
                    this.player2Data.characterData.rogue.actionRatio = Utils.round(this.player2Data.characterData.rogue.actions / this.totalPlayerActions, 2);
                    break
                }
            default:
                {
                    this.logger.logError(`Invalid character for player 2 specified for action tracking: ${character.name}`);
                    break
                }
        }
    }

    addTotalDamageOut(amount) {
        this.totalPlayerDamageOut += amount;
    }

    addTotalHealOut(amount) {
        this.totalHealOut += amount;
    }


    //TODO: This could all be simplified by using action data when it's processed instead of posthoc.
    addPlayer1DamageOut(character, amount) {
        this.player1Data.damageOut += amount;
        switch (character.name) {
            case Constants.WARRIOR_NAME:
                {
                    this.player1Data.characterData.warrior.damageOut += amount;
                    this.player1Data.characterData.warrior.damageOutRatio = Utils.round(this.player1Data.characterData.warrior.damageOut / this.totalPlayerDamageOut, 2)
                    break
                }
            case Constants.MAGE_NAME:
                {
                    this.player1Data.characterData.mage.damageOut += amount;
                    this.player1Data.characterData.mage.damageOutRatio = Utils.round(this.player1Data.characterData.mage.damageOut / this.totalPlayerDamageOut, 2)
                    break
                }
            case Constants.PRIEST_NAME:
                {
                    this.player1Data.characterData.priest.damageOut += amount;
                    this.player1Data.characterData.priest.damageOutRatio = Utils.round(this.player1Data.characterData.priest.damageOut / this.totalPlayerDamageOut, 2)
                    break
                }
            case Constants.ROGUE_NAME:
                {
                    this.player1Data.characterData.rogue.damageOut += amount;
                    this.player1Data.characterData.rogue.damageOutRatio = Utils.round(this.player1Data.characterData.rogue.damageOut / this.totalPlayerDamageOut, 2)
                    break
                }
            default:
                {
                    this.logger.logError(`Invalid character for player 1 specified for damage out tracking: ${character.name}`);
                    break
                }
        }
    }

    addPlayer2DamageOut(character, amount) {
        this.player2Data.damageOut += amount;
        switch (character.name) {
            case Constants.WARRIOR_NAME:
                {
                    this.player2Data.characterData.warrior.damageOut += amount;
                    this.player2Data.characterData.warrior.damageOutRatio = Utils.round(this.player2Data.characterData.warrior.damageOut / this.totalPlayerDamageOut, 2)
                    break
                }
            case Constants.MAGE_NAME:
                {
                    this.player2Data.characterData.mage.damageOut += amount;
                    this.player2Data.characterData.mage.damageOutRatio = Utils.round(this.player2Data.characterData.mage.damageOut / this.totalPlayerDamageOut, 2)
                    break
                }
            case Constants.PRIEST_NAME:
                {
                    this.player2Data.characterData.priest.damageOut += amount;
                    this.player2Data.characterData.priest.damageOutRatio = Utils.round(this.player2Data.characterData.priest.damageOut / this.totalPlayerDamageOut, 2)
                    break
                }
            case Constants.ROGUE_NAME:
                {
                    this.player2Data.characterData.rogue.damageOut += amount;
                    this.player2Data.characterData.rogue.damageOutRatio = Utils.round(this.player2Data.characterData.rogue.damageOut / this.totalPlayerDamageOut, 2)
                    break
                }
            default:
                {
                    this.logger.logError(`Invalid character for player 2 specified for damage out tracking: ${character.name}`);
                    break
                }
        }
    }

    addPlayer1DamageIn(character, amount) {
        this.player1Data.damageIn += amount;
        switch (character.name) {
            case Constants.WARRIOR_NAME:
                {
                    this.player1Data.characterData.warrior.damageIn += amount;
                    this.player1Data.characterData.warrior.damageInRatio = Utils.round(this.player1Data.characterData.warrior.damageIn / this.totalPlayerDamageIn, 2)
                    break
                }
            case Constants.MAGE_NAME:
                {
                    this.player1Data.characterData.mage.damageIn += amount;
                    this.player1Data.characterData.mage.damageInRatio = Utils.round(this.player1Data.characterData.mage.damageIn / this.totalPlayerDamageIn, 2)
                    break
                }
            case Constants.PRIEST_NAME:
                {
                    this.player1Data.characterData.priest.damageIn += amount;
                    this.player1Data.characterData.priest.damageInRatio = Utils.round(this.player1Data.characterData.priest.damageIn / this.totalPlayerDamageIn, 2)
                    break
                }
            case Constants.ROGUE_NAME:
                {
                    this.player1Data.characterData.rogue.damageIn += amount;
                    this.player1Data.characterData.rogue.damageInRatio = Utils.round(this.player1Data.characterData.rogue.damageIn / this.totalPlayerDamageIn, 2)
                    break
                }
            default:
                {
                    this.logger.logError(`Invalid character for player 1 specified for damage in tracking: ${character.name}`);
                    break
                }
        }
    }

    addPlayer2DamageIn(character, amount) {
        this.player2Data.damageIn += amount;
        switch (character.name) {
            case Constants.WARRIOR_NAME:
                {
                    this.player2Data.characterData.warrior.damageIn += amount;
                    this.player2Data.characterData.warrior.damageInRatio = Utils.round(this.player2Data.characterData.warrior.damageIn / this.totalPlayerDamageIn, 2)
                    break
                }
            case Constants.MAGE_NAME:
                {
                    this.player2Data.characterData.mage.damageIn += amount;
                    this.player2Data.characterData.mage.damageInRatio = Utils.round(this.player2Data.characterData.mage.damageIn / this.totalPlayerDamageIn, 2)
                    break
                }
            case Constants.PRIEST_NAME:
                {
                    this.player2Data.characterData.priest.damageIn += amount;
                    this.player2Data.characterData.priest.damageInRatio = Utils.round(this.player2Data.characterData.priest.damageIn / this.totalPlayerDamageIn, 2)
                    break
                }
            case Constants.ROGUE_NAME:
                {
                    this.player2Data.characterData.rogue.damageIn += amount;
                    this.player2Data.characterData.rogue.damageInRatio = Utils.round(this.player2Data.characterData.rogue.damageIn / this.totalPlayerDamageIn, 2)
                    break
                }
            default:
                {
                    this.logger.logError(`Invalid character for player 2 specified for damage in tracking: ${character.name}`);
                    break
                }
        }
    }

    addPlayer1HealOut(character, amount) {
        this.player1Data.healOut += amount;
        switch (character.name) {
            case Constants.WARRIOR_NAME:
                {
                    this.player1Data.characterData.warrior.healOut += amount;
                    break
                }
            case Constants.MAGE_NAME:
                {
                    this.player1Data.characterData.mage.healOut += amount;
                    break
                }
            case Constants.PRIEST_NAME:
                {
                    this.player1Data.characterData.priest.healOut += amount;
                    break
                }
            case Constants.ROGUE_NAME:
                {
                    this.player1Data.characterData.rogue.healOut += amount;
                    break
                }
            default:
                {
                    this.logger.logError(`Invalid character for player 1 specified for damage out tracking: ${character.name}`);
                    break
                }
        }
    }

    addPlayer2HealOut(character, amount) {
        this.player2Data.healOut += amount;
        switch (character.name) {
            case Constants.WARRIOR_NAME:
                {
                    this.player2Data.characterData.warrior.healOut += amount;
                    break
                }
            case Constants.MAGE_NAME:
                {
                    this.player2Data.characterData.mage.healOut += amount;
                    break
                }
            case Constants.PRIEST_NAME:
                {
                    this.player2Data.characterData.priest.healOut += amount;
                    break
                }
            case Constants.ROGUE_NAME:
                {
                    this.player2Data.characterData.rogue.healOut += amount;
                    break
                }
            default:
                {
                    this.logger.logError(`Invalid character for player 2 specified for damage out tracking: ${character.name}`);
                    break
                }
        }
    }

    addPlayer1HealIn(character, amount) {
        this.player1Data.healIn += amount;
        switch (character.name) {
            case Constants.WARRIOR_NAME:
                {
                    this.player1Data.characterData.warrior.healIn += amount;
                    break
                }
            case Constants.MAGE_NAME:
                {
                    this.player1Data.characterData.mage.healIn += amount;
                    break
                }
            case Constants.PRIEST_NAME:
                {
                    this.player1Data.characterData.priest.healIn += amount;
                    break
                }
            case Constants.ROGUE_NAME:
                {
                    this.player1Data.characterData.rogue.healIn += amount;
                    break
                }
            default:
                {
                    this.logger.logError(`Invalid character for player 1 specified for damage in tracking: ${character.name}`);
                    break
                }
        }
    }

    addPlayer2HealIn(character, amount) {
        this.player2Data.healOut += amount;
        switch (character.name) {
            case Constants.WARRIOR_NAME:
                {
                    this.player2Data.characterData.warrior.healIn += amount;
                    break
                }
            case Constants.MAGE_NAME:
                {
                    this.player2Data.characterData.mage.healIn += amount;
                    break
                }
            case Constants.PRIEST_NAME:
                {
                    this.player2Data.characterData.priest.healIn += amount;
                    break
                }
            case Constants.ROGUE_NAME:
                {
                    this.player2Data.characterData.rogue.healIn += amount;
                    break
                }
            default:
                {
                    this.logger.logError(`Invalid character for player 2 specified for damage in tracking: ${character.name}`);
                    break
                }
        }
    }

    deleteSingletonInstance() {
        GameState.instance = null;
    }

}

module.exports = GameState;