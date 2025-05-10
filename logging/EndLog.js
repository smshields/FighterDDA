 class EndLog {

    constructor(gameState, loser) {
        this.loser = loser;
        this.totalTimeSteps = gameState.timeStep;
        this.totalActions = gameState.totalPlayerActions;
        this.totalDamageOut = gameState.totalPlayerDamageOut;
        this.player1DamageOut = gameState.player1Data.damageOut;
        this.player1TotalActions = gameState.player1Data.actions;
        this.player2DamageOut = gameState.player2Data.damageOut;
        this.player2TotalActions = gameState.player2Data.actions;
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
            player2TotalActions: this.player2TotalActions
        };
    }
}

module.exports = EndLog;