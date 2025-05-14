const TimeStepLog = require('./TimeStepLog');
const Logger = require('./Logger');

class EndLog {

    constructor(gameState, loser) {
        //used for end-state processesing
        this.timeStepLog = [];
        this.logger = new Logger(); //singleton

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
    }

    postGameProcess() {
        if (!this.timeStepLog) {
            this.logger.logError("Endlog - postGameProcess: Error processing post game, timeStepLog not set.");
            return false;
        }

        //Number of Director Changes made during the game;
        this.numDirectorChanges = this.calculateNumDirectorChanges();
    }

    calculateNumDirectorChanges() {
        let numDirectorChanges = 0;
        for(let timeStepLog of this.timeStepLog){
            for(let directorAction of timeStepLog.directorActions){
                numDirectorChanges++;
            }
        }
        return numDirectorChanges;
    }

    setTimeStepLog(timeStepLog) {
        this.timeStepLog = timeStepLog;
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
            numDirectorChanges: this.numDirectorChanges
        };
    }
}

module.exports = EndLog;