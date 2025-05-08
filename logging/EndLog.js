class EndLog {

	constructor(gameState, winner) {
		this.winner = winner;
		this.totalTimeSteps = gameState.timeStep;
		this.totalActions = gameState.totalPlayerActions;
		this.totalDamageOut = gameState.totalPlayerDamageOut;
		this.player1DamageOut = gameState.player1Data.damageOut;
		this.player1TotalActions = gameState.player1Data.actions;
		this.player2DamageOut = gameState.player2Data.damageOut;
		this.player2DamageOut = gameState.player2Data.actions;
	}

	toJSON() {
		return JSON.stringify(this, (key, value) => {
			if (value !== null) return value
		}, 2);
	}
}

module.exports = EndLog;