const ActionQueueLog = require('./ActionQueueLog');
const GameState = require('../core/GameState');

class TimeStepLog {

    constructor(currentTimeStep) {

        //get singleton
        this.gameState = new GameState();

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
            characters: {
                warrior: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0
                },
                mage: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0
                },
                priest: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0
                },
                rogue: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0
                }
            }
        };
        this.player2 = {
            player2TotalActions: 0,
            player2CurrentTotalHealth: 0,
            player2CurrentHPRatio: 0,
            player2TotalDamageDealt: 0,
            player2TotalDamageTaken: 0,
            characters: {
                warrior: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0
                },
                mage: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0
                },
                priest: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0
                },
                rogue: {
                    stats: {},
                    actionsTaken: 0,
                    totalDamageOut: 0,
                    totalDamageIn: 0
                }
            }
        };
    }

    updateLogFromGameState(gameState) {
        this.actionsInQueue = new ActionQueueLog(this.gameState.actionQueue);

        this.totalActions = gameState.totalPlayerActions;
        this.totalCurrentHP = gameState.currentHP;

        //player 1 details
        this.player1.totalActions = gameState.player1Data.actions;
        this.player1.currentHP = gameState.player1Data.currentHP;
        this.player1.hpRatio = gameState.player1Data.hpRatio;
        this.player1.totalDamageOut = gameState.player1Data.damageOut;
        this.player1.totalDamageIn = gameState.player1Data.damageIn;

        //Player 1 character details
        this.player1.characters.warrior.stats = gameState.player1Data.characterData.warrior.stats;
        this.player1.characters.warrior.actionsTaken = gameState.player1Data.characterData.warrior.actions;
        this.player1.characters.warrior.totalDamageOut = gameState.player1Data.characterData.warrior.damageOut;
        this.player1.characters.warrior.totalDamageIn = gameState.player1Data.characterData.warrior.damageIn;

        this.player1.characters.mage.stats = gameState.player1Data.characterData.mage.stats;
        this.player1.characters.mage.actionsTaken = gameState.player1Data.characterData.mage.actions;
        this.player1.characters.mage.totalDamageOut = gameState.player1Data.characterData.mage.damageOut;
        this.player1.characters.mage.totalDamageIn = gameState.player1Data.characterData.mage.damageIn;

        this.player1.characters.priest.stats = gameState.player1Data.characterData.priest.stats;
        this.player1.characters.priest.actionsTaken = gameState.player1Data.characterData.priest.actions;
        this.player1.characters.priest.totalDamageOut = gameState.player1Data.characterData.priest.damageOut;
        this.player1.characters.priest.totalDamageIn = gameState.player1Data.characterData.priest.damageIn;

        this.player1.characters.rogue.stats = gameState.player1Data.characterData.rogue.stats;
        this.player1.characters.rogue.actionsTaken = gameState.player1Data.characterData.rogue.actions;
        this.player1.characters.rogue.totalDamageOut = gameState.player1Data.characterData.rogue.damageOut;
        this.player1.characters.rogue.totalDamageIn = gameState.player1Data.characterData.rogue.damageIn;

        //player 2 details
        this.player2.totalActions = gameState.player2Data.actions;
        this.player2.currentHP = gameState.player2Data.currentHP;
        this.player2.hpRatio = gameState.player2Data.hpRatio;
        this.player2.totalDamageOut = gameState.player2Data.damageOut;
        this.player2.totalDamageIn = gameState.player2Data.damageIn;

        //Player 2 character details
        this.player2.characters.warrior.stats = gameState.player2Data.characterData.warrior.stats;
        this.player2.characters.warrior.actionsTaken = gameState.player2Data.characterData.warrior.actions;
        this.player2.characters.warrior.totalDamageOut = gameState.player2Data.characterData.warrior.damageOut;
        this.player2.characters.warrior.totalDamageIn = gameState.player2Data.characterData.warrior.damageIn;

        this.player2.characters.mage.stats = gameState.player2Data.characterData.mage.stats;
        this.player2.characters.mage.actionsTaken = gameState.player2Data.characterData.mage.actions;
        this.player2.characters.mage.totalDamageOut = gameState.player2Data.characterData.mage.damageOut;
        this.player2.characters.mage.totalDamageIn = gameState.player2Data.characterData.mage.damageIn;

        this.player2.characters.priest.stats = gameState.player2Data.characterData.priest.stats;
        this.player2.characters.priest.actionsTaken = gameState.player2Data.characterData.priest.actions;
        this.player2.characters.priest.totalDamageOut = gameState.player2Data.characterData.priest.damageOut;
        this.player2.characters.priest.totalDamageIn = gameState.player2Data.characterData.priest.damageIn;

        this.player2.characters.rogue.stats = gameState.player2Data.characterData.rogue.stats;
        this.player2.characters.rogue.actionsTaken = gameState.player2Data.characterData.rogue.actions;
        this.player2.characters.rogue.totalDamageOut = gameState.player2Data.characterData.rogue.damageOut;
        this.player2.characters.rogue.totalDamageIn = gameState.player2Data.characterData.rogue.damageIn;
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
                player2TotalActions: this.player2.player2TotalActions,
                player2CurrentTotalHealth: this.player2.player2CurrentTotalHealth,
                player2CurrentHPRatio: this.player2.player2CurrentHPRatio,
                player2TotalDamageDealt: this.player2.player2TotalDamageDealt,
                player2TotalDamageTaken: this.player2.player2TotalDamageTaken,
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