const TimeStepLog = require('./TimeStepLog');
const Logger = require('./Logger');

class EndLog {

    constructor(gameState, loser) {
        //used for end-state processesing
        this.timeStepLogs = [];
        this.gameState = gameState;

        this.loser = loser;
        this.totalTimeSteps = gameState.timeStep;
        this.totalActions = gameState.totalPlayerActions;
        this.totalDamageOut = gameState.totalPlayerDamageOut;
        this.player1DamageOut = gameState.player1Data.damageOut;
        this.player1TotalActions = gameState.player1Data.actions;
        this.player2DamageOut = gameState.player2Data.damageOut;
        this.player2TotalActions = gameState.player2Data.actions;

        //post-game processesing
        this.numDirectorChanges = -1;
        this.numLeadChangesByRatio = -1;
        this.numLeadChangesByValue = -1;
        this.player1To2ActionRatio = -1; //Number of player 1 actions for each player 2 action
        this.winningPlayerRemainingHP = -1;
        this.directorStatChangeAverageAbsolute = -1;
        this.directorStatChangeAverageBuff = -1;
        this.directorStatChangeAverageNerf = -1;

    }

    postGameProcess(logger) {



        if (!this.timeStepLogs) {
            return false;
        }

        //Number of Director Changes made during the game;
        this.numDirectorChanges = this.calculateNumDirectorChanges();

        //Lead Changes
        let leadChangeData = this.calculateNumLeadChanges();

        this.numLeadChangesByRatio = leadChangeData.numLeadChangesByRatio;
        this.numLeadChangesByValue = leadChangeData.numLeadChangesByValue;

        //Action Ratio
        this.player1To2ActionRatio = this.calculatePlayerActionRatio();

        //Winning player remaining HP
        this.winningPlayerRemainingHP = this.calculateRemainingHPForWinner();

        //Director Stat Changes
        let directorChangeData = this.calculateAverageDirectorStatChanges();
        this.directorStatChangeAverageAbsolute = directorChangeData.totalAverage;
        this.directorStatChangeAverageBuff = directorChangeData.buffAverage;
        this.directorStatChangeAverageNerf = directorChangeData.nerfAverage;


        return true;
    }

    calculateRemainingHPForWinner() {
        if (this.loser === 1) {
            return this.gameState.player2Data.currentHP;
        } else if (this.loser === 2) {
            return this.gameState.player1Data.currentHP;
        } else {
            return this.gameState.player1Data.currentHP + this.gameState.player2Data.currentHP;
        }
    }

    calculateAverageDirectorStatChanges() {
        let totalSum = 0;
        let buffSum = 0;
        let nerfSum = 0;
        let numDirectorChanges = 0;

        for (let timeStepLog of this.timeStepLogs) {
            for (let directorAction of timeStepLog.directorActions) {
                numDirectorChanges += directorAction.targets.length;
                let actionChangeSum = directorAction.statChange * directorAction.targets.length;
                totalSum += actionChangeSum;
                if (directorAction.statChange >= 0) {
                    buffSum += actionChangeSum;
                } else {
                    nerfSum += actionChangeSum;
                }
            }
        }

        let totalAverage = totalSum / numDirectorChanges;
        let buffAverage = buffSum / numDirectorChanges;
        let nerfAverage = nerfSum / numDirectorChanges;

        return {
            "totalAverage": totalAverage,
            "buffAverage": buffAverage,
            "nerfAverage": nerfAverage
        }

    }

    calculatePlayerActionRatio() {
        return this.gameState.player1Data.actions / this.gameState.player2Data.actions;
    }

    calculateNumLeadChanges() {
        let numLeadChangesByRatio = 0;
        let numLeadChangesByValue = 0;

        //initialize leads based on initial stats
        let leadingPlayerByRatio = 0; //always starts as draw
        let leadingPlayerByValue = 0; //depends on character stat rolls
        let player1StartingHP = this.timeStepLogs[0].player1.currentHP;
        let player2StartingHP = this.timeStepLogs[0].player2.currentHP;
        if (player1StartingHP > player2StartingHP) {
            leadingPlayerByValue = 1;
        } else if (player2StartingHP > player1StartingHP) {
            leadingPlayerByValue = 2;
        } else {
            leadingPlayerByValue = 0; //tied
        }

        for (let timeStepLog of this.timeStepLogs) {
            let p1CurrentHP = timeStepLog.player1.currentHP;
            let p1CurrentHPRatio = timeStepLog.player1.hpRatio;

            let p2CurrentHP = timeStepLog.player2.currentHP;
            let p2CurrentHPRatio = timeStepLog.player2.hpRatio;

            let prevLeadingPlayerByRatio = leadingPlayerByRatio;
            let prevLeadingPlayerByValue = leadingPlayerByValue;

            //by value
            if (p1CurrentHP > p2CurrentHP) {
                leadingPlayerByValue = 1;
            } else if (p2CurrentHP > p1CurrentHP) {
                leadingPlayerByValue = 2;
            } else {
                leadingPlayerByValue = 0; //tied
            }

            if (leadingPlayerByValue !== prevLeadingPlayerByValue) {
                numLeadChangesByValue++;
            }

            //by ratio
            if (p1CurrentHPRatio > p2CurrentHPRatio) {
                leadingPlayerByRatio = 1;
            } else if (p2CurrentHPRatio > p1CurrentHPRatio) {
                leadingPlayerByRatio = 2;
            } else {
                leadingPlayerByRatio = 0; //tied
            }

            if (leadingPlayerByRatio !== prevLeadingPlayerByRatio) {
                numLeadChangesByRatio++;
            }
        }

        return {
            "numLeadChangesByRatio": numLeadChangesByRatio,
            "numLeadChangesByValue": numLeadChangesByValue
        };
    }

    calculateNumDirectorChanges() {
        let numDirectorChanges = 0;
        for (let timeStepLog of this.timeStepLogs) {
            for (let directorAction of timeStepLog.directorActions) {
                numDirectorChanges++;
            }
        }
        return numDirectorChanges;
    }

    setTimeStepLogs(timeStepLogs) {
        this.timeStepLogs = timeStepLogs;
    }

    toJSON() {
        return {
            loser: this.loser,
            totalTimeSteps: this.totalTimeSteps,
            totalActions: this.totalActions,
            totalDamageOut: this.totalDamageOut,
            player1DamageOut: this.player1DamageOut,
            player1TotalActions: this.player1TotalActions,
            player2DamageOut: this.player2DamageOut,
            player2TotalActions: this.player2TotalActions,
            numDirectorChanges: this.numDirectorChanges,
            numLeadChangesByRatio: this.numLeadChangesByRatio,
            numLeadChangesByValue: this.numLeadChangesByValue,
            player1To2ActionRatio: this.player1To2ActionRatio,
            winningPlayerRemainingHP: this.winningPlayerRemainingHP,
            directorStatChangeAverageAbsolute: this.directorStatChangeAverageAbsolute,
            directorStatChangeAverageBuff: this.directorStatChangeAverageBuff,
            directorStatChangeAverageNerf: this.directorStatChangeAverageNerf
        };
    }
}

module.exports = EndLog;