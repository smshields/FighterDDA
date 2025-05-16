class EndLogPlayer {

	//TODO: Move character data to it's own class.
	constructor(gameState) {
		this.gameState = gameState;
		this.playerNum = 0;
		this.singleToMultiActionRatio = 1;
		this.totalDefends = 0;
		this.characters = {
			warrior: {
				totalDamageIn: 0,
				totalDamageOut: 0,
				playerDamageRatio: 0,
				gameDamageRatio: 0,
				totalHealIn: 0,
				totalHealOut: 0,
				playerHealRatio: 0,
				gameHealRatio: 0,
				numSingleActions: 0,
				numMultiActions: 0,
				totalDefends: 0,
				defendRatio: 0
			},
			mage: {
				totalDamageIn: 0,
				totalDamageOut: 0,
				playerDamageRatio: 0,
				gameDamageRatio: 0,
				totalHealIn: 0,
				totalHealOut: 0,
				playerHealRatio: 0,
				gameHealRatio: 0,
				numSingleActions: 0,
				numMultiActions: 0,
				totalDefends: 0,
				defendRatio: 0
			},
			priest: {
				totalDamageIn: 0,
				totalDamageOut: 0,
				playerDamageRatio: 0,
				gameDamageRatio: 0,
				totalHealIn: 0,
				totalHealOut: 0,
				playerHealRatio: 0,
				gameHealRatio: 0,
				numSingleActions: 0,
				numMultiActions: 0,
				totalDefends: 0,
				defendRatio: 0
			},
			rogue: {
				totalDamageIn: 0,
				totalDamageOut: 0,
				playerDamageRatio: 0,
				gameDamageRatio: 0,
				totalHealIn: 0,
				totalHealOut: 0,
				playerHealRatio: 0,
				gameHealRatio: 0,
				numSingleActions: 0,
				numMultiActions: 0,
				totalDefends: 0,
				defendRatio: 0
			}
		};

	}

	updateCharacterLogs(timeStepLogs) {

	}

}

module.exports = EndLogPlayer;