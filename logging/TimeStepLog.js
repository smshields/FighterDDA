const ActionQueueLog = require('./ActionQueueLog');
const GameState = require('../core/GameState');

class TimeStepLog {

    constructor(currentTimeStep) {

        //get singleton
        //this.gameState = new GameState();

        this.timeStep = currentTimeStep; //done
        this.totalActions = 0;
        this.totalCurrentHP = 0;
        this.actionsInQueue = [];
        this.actionsExecuted = [];
        this.directorActions = [];
        this.player1 = {
            totalActions: 0,
            currentHP: 0,
            hpRatio: 0,
            totalDamageOut: 0,
            totalDamageIn: 0,
            totalHealOut: 0,
            characters: {
                warrior: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0,
                    totalHealOut: 0,
                    totalHealIn: 0
                },
                mage: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0,
                    totalHealOut: 0,
                    totalHealIn: 0
                },
                priest: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0,
                    totalHealOut: 0,
                    totalHealIn: 0
                },
                rogue: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0,
                    totalHealOut: 0,
                    totalHealIn: 0
                }
            }
        };
        this.player2 = {
            player2TotalActions: 0,
            player2CurrentTotalHealth: 0,
            player2CurrentHPRatio: 0,
            player2TotalDamageDealt: 0,
            player2TotalDamageTaken: 0,
            totalHealOut: 0,
            characters: {
                warrior: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0,
                    totalHealOut: 0,
                    totalHealIn: 0
                },
                mage: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0,
                    totalHealOut: 0,
                    totalHealIn: 0
                },
                priest: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0,
                    totalHealOut: 0,
                    totalHealIn: 0
                },
                rogue: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0,
                    totalHealOut: 0,
                    totalHealIn: 0
                }
            }
        };
    }

    updateLogFromGameState(gameState) {
        this.actionsInQueue = new ActionQueueLog(gameState.actionQueue);

        this.totalActions = gameState.totalPlayerActions;
        this.totalCurrentHP = gameState.currentHP;

        //player 1 details
        this.player1.totalActions = gameState.player1Data.actions;
        this.player1.currentHP = gameState.player1Data.currentHP;
        this.player1.hpRatio = gameState.player1Data.hpRatio;
        this.player1.totalDamageOut = gameState.player1Data.damageOut;
        this.player1.totalDamageIn = gameState.player1Data.damageIn;

        //Player 1 character details
        this.player1.characters.warrior.stats = structuredClone(gameState.player1Data.characterData.warrior.stats);
        this.player1.characters.warrior.actionsTaken = gameState.player1Data.characterData.warrior.actions;
        this.player1.characters.warrior.totalDamageOut = gameState.player1Data.characterData.warrior.damageOut;
        this.player1.characters.warrior.totalDamageIn = gameState.player1Data.characterData.warrior.damageIn;
        this.player1.characters.warrior.totalHealOut = gameState.player1Data.characterData.warrior.healOut;
        this.player1.characters.warrior.totalHealIn = gameState.player1Data.characterData.warrior.healIn;

        this.player1.characters.mage.stats = structuredClone(gameState.player1Data.characterData.mage.stats);
        this.player1.characters.mage.actionsTaken = gameState.player1Data.characterData.mage.actions;
        this.player1.characters.mage.totalDamageOut = gameState.player1Data.characterData.mage.damageOut;
        this.player1.characters.mage.totalDamageIn = gameState.player1Data.characterData.mage.damageIn;
        this.player1.characters.mage.totalHealOut = gameState.player1Data.characterData.mage.healOut;
        this.player1.characters.mage.totalHealIn = gameState.player1Data.characterData.mage.healIn;

        this.player1.characters.priest.stats = structuredClone(gameState.player1Data.characterData.priest.stats);
        this.player1.characters.priest.actionsTaken = gameState.player1Data.characterData.priest.actions;
        this.player1.characters.priest.totalDamageOut = gameState.player1Data.characterData.priest.damageOut;
        this.player1.characters.priest.totalDamageIn = gameState.player1Data.characterData.priest.damageIn;
        this.player1.characters.priest.totalHealOut = gameState.player1Data.characterData.priest.healOut;
        this.player1.characters.priest.totalHealIn = gameState.player1Data.characterData.priest.healIn;

        this.player1.characters.rogue.stats = structuredClone(gameState.player1Data.characterData.rogue.stats);
        this.player1.characters.rogue.actionsTaken = gameState.player1Data.characterData.rogue.actions;
        this.player1.characters.rogue.totalDamageOut = gameState.player1Data.characterData.rogue.damageOut;
        this.player1.characters.rogue.totalDamageIn = gameState.player1Data.characterData.rogue.damageIn;
        this.player1.characters.rogue.totalHealOut = gameState.player1Data.characterData.rogue.healOut;
        this.player1.characters.rogue.totalHealIn = gameState.player1Data.characterData.rogue.healIn;

        //player 2 details
        this.player2.totalActions = gameState.player2Data.actions;
        this.player2.currentHP = gameState.player2Data.currentHP;
        this.player2.hpRatio = gameState.player2Data.hpRatio;
        this.player2.totalDamageOut = gameState.player2Data.damageOut;
        this.player2.totalDamageIn = gameState.player2Data.damageIn;

        //Player 2 character details
        this.player2.characters.warrior.stats = structuredClone(gameState.player2Data.characterData.warrior.stats);
        this.player2.characters.warrior.actionsTaken = gameState.player2Data.characterData.warrior.actions;
        this.player2.characters.warrior.totalDamageOut = gameState.player2Data.characterData.warrior.damageOut;
        this.player2.characters.warrior.totalDamageIn = gameState.player2Data.characterData.warrior.damageIn;
        this.player2.characters.warrior.totalHealOut = gameState.player2Data.characterData.warrior.healOut;
        this.player2.characters.warrior.totalHealIn = gameState.player2Data.characterData.warrior.healIn;

        this.player2.characters.mage.stats = structuredClone(gameState.player2Data.characterData.mage.stats);
        this.player2.characters.mage.actionsTaken = gameState.player2Data.characterData.mage.actions;
        this.player2.characters.mage.totalDamageOut = gameState.player2Data.characterData.mage.damageOut;
        this.player2.characters.mage.totalDamageIn = gameState.player2Data.characterData.mage.damageIn;
        this.player2.characters.mage.totalHealOut = gameState.player2Data.characterData.mage.healOut;
        this.player2.characters.mage.totalHealIn = gameState.player2Data.characterData.mage.healIn;

        this.player2.characters.priest.stats = structuredClone(gameState.player2Data.characterData.priest.stats);
        this.player2.characters.priest.actionsTaken = gameState.player2Data.characterData.priest.actions;
        this.player2.characters.priest.totalDamageOut = gameState.player2Data.characterData.priest.damageOut;
        this.player2.characters.priest.totalDamageIn = gameState.player2Data.characterData.priest.damageIn;
        this.player2.characters.priest.totalHealOut = gameState.player2Data.characterData.priest.healOut;
        this.player2.characters.priest.totalHealIn = gameState.player2Data.characterData.priest.healIn;

        this.player2.characters.rogue.stats = structuredClone(gameState.player2Data.characterData.rogue.stats);
        this.player2.characters.rogue.actionsTaken = gameState.player2Data.characterData.rogue.actions;
        this.player2.characters.rogue.totalDamageOut = gameState.player2Data.characterData.rogue.damageOut;
        this.player2.characters.rogue.totalDamageIn = gameState.player2Data.characterData.rogue.damageIn;
        this.player2.characters.rogue.totalHealOut = gameState.player2Data.characterData.rogue.healOut;
        this.player2.characters.rogue.totalHealIn = gameState.player2Data.characterData.rogue.healIn;
    }

    toJSON() {
        return {
            timeStep: this.timeStep,
            totalActions: this.totalActions,
            totalCurrentHP: this.totalCurrentHP,
            actionsInQueue: this.actionsInQueue.toJSON(),
            actionsExecuted: this.actionsExecuted,
            directorActions: this.directorActions,
            player1: {
                totalActions: this.player1.totalActions,
                currentHP: this.player1.currentHP,
                hpRatio: this.player1.hpRatio,
                totalDamageOut: this.player1.totalDamageOut,
                totalDamageIn: this.player1.totalDamageIn,
                characters: {
                    warrior: {
                        stats: this.player1.characters.warrior.stats,
                        actionsTaken: this.player1.characters.warrior.actionsTaken,
                        totalDamageOut: this.player1.characters.warrior.totalDamageOut,
                        totalDamageIn: this.player1.characters.warrior.totalDamageIn
                    },
                    mage: {
                        stats: this.player1.characters.mage.stats,
                        actionsTaken: this.player1.characters.mage.actionsTaken,
                        totalDamageOut: this.player1.characters.mage.totalDamageOut,
                        totalDamageIn: this.player1.characters.mage.totalDamageIn
                    },
                    priest: {
                        stats: this.player1.characters.priest.stats,
                        actionsTaken: this.player1.characters.priest.actionsTaken,
                        totalDamageOut: this.player1.characters.priest.totalDamageOut,
                        totalDamageIn: this.player1.characters.priest.totalDamageIn
                    },
                    rogue: {
                        stats: this.player1.characters.rogue.stats,
                        actionsTaken: this.player1.characters.rogue.actionsTaken,
                        totalDamageOut: this.player1.characters.rogue.totalDamageOut,
                        totalDamageIn: this.player1.characters.rogue.totalDamageIn
                    }
                }
            },
            player2: {
                totalActions: this.player2.totalActions,
                currentHP: this.player2.currentHP,
                hpRatio: this.player2.hpRatio,
                totalDamageOut: this.player2.totalDamageDealt,
                totalDamageIn: this.player2.totalDamageIn,
                characters: {
                    warrior: {
                        stats: this.player2.characters.warrior.stats,
                        actionsTaken: this.player2.characters.warrior.actionsTaken,
                        totalDamageOut: this.player2.characters.warrior.totalDamageOut,
                        totalDamageIn: this.player2.characters.warrior.totalDamageIn
                    },
                    mage: {
                        stats: this.player2.characters.mage.stats,
                        actionsTaken: this.player2.characters.mage.actionsTaken,
                        totalDamageOut: this.player2.characters.mage.totalDamageOut,
                        totalDamageIn: this.player2.characters.mage.totalDamageIn
                    },
                    priest: {
                        stats: this.player2.characters.priest.stats,
                        actionsTaken: this.player2.characters.priest.actionsTaken,
                        totalDamageOut: this.player2.characters.priest.totalDamageOut,
                        totalDamageIn: this.player2.characters.priest.totalDamageIn
                    },
                    rogue: {
                        stats: this.player2.characters.rogue.stats,
                        actionsTaken: this.player2.characters.rogue.actionsTaken,
                        totalDamageOut: this.player2.characters.rogue.totalDamageOut,
                        totalDamageIn: this.player2.characters.rogue.totalDamageIn
                    }
                }
            }
        };
    }
}

module.exports = TimeStepLog;