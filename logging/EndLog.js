const TimeStepLog = require('./TimeStepLog');
const Logger = require('./Logger');

class EndLog {

    constructor(gameState, loser) {
        //used for end-state processesing
        this.timeStepLogs = [];

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

        return true;
    }

    calculateNumLeadChanges(){
        let numLeadChangesByRatio = 0;
        let numLeadChangesByValue = 0;

        let leadingPlayerByRatio = 0;
        let leadingPlayerByValue = 0;

        for(let timeStepLog of this.timeStepLogs) {
            let p1CurrentHP = timeStepLog.player1.currentHP;
            let p1CurrentHPRatio = timeStepLog.player1.hpRatio;

            let p2CurrentHP = timeStepLog.player2.currentHP;
            let p2CurrentHPRatio = timeStepLog.player2.hpRatio;

            let prevLeadingPlayerByRatio = leadingPlayerByRatio;
            let prevLeadingPlayerByValue = leadingPlayerByValue;

            //by value
            if(p1CurrentHP > p2CurrentHP) {
                leadingPlayerByValue = 1;
            } else if(p2CurrentHP > p1CurrentHP) {
                leadingPlayerByValue = 2;
            } else {
                leadingPlayerByValue = 0; //tied
            }

            if(leadingPlayerByValue !== prevLeadingPlayerByValue) {
                numLeadChangesByValue++;
            }

            //by ratio
            if(p1CurrentHPRatio > p2CurrentHPRatio) {
                leadingPlayerByRatio = 1;
            } else if(p2CurrentHPRatio > p1CurrentHPRatio) {
                leadingPlayerByRatio = 2;
            } else {
                leadingPlayerByRatio = 0; //tied
            }

            if(leadingPlayerByRatio !== prevLeadingPlayerByRatio){
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
        for(let timeStepLog of this.timeStepLogs){
            for(let directorAction of timeStepLog.directorActions){
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
            numLeadChangesByValue: this.numLeadChangesByValue
        };
    }
}

module.exports = EndLog;