const Constants = require('../utils/Constants');

class InitialLog {

	constructor() {
		this.mode = Constants.BALANCE_MODE;
		this.targetActions = Constants.TARGET_ACTIONS;
		this.player1AI = Constants.PLAYER_1_AI;
		this.player1TotalHP = 0;
		this.player2AI = Constants.PLAYER_2_AI;
		this.player2TotalHP = 0;
		this.totalHP = 0;
		this.seed = Constants.RNG_SEED;
		this.multiScalar = Constants.MULTI_TARGET_SCALAR;
		this.singleScalar = Constants.SINGLE_TARGET_SCALAR;
		this.healScalar = Constants.HEAL_SCALAR;
		this.multiHealScalar = Constants.MULTI_HEAL_SCALAR;
		this.speedScalar = Constants.SPEED_SCALAR;
		this.defenseScalar = Constants.DEFENSE_SCALAR;
		this.maxBuffAmount = Constants.MAX_BUFF_AMOUNT;
		this.minBuffAmount = Constants.MIN_BUFF_AMOUNT;
		this.difficultyScalar = Constants.DIFFICULTY_ADJUSTMENT_SCALAR;
		this.statFuzziness = Constants.STAT_FUZZINESS;
	}

	initInitialLog(player1TotalHP, player2TotalHP){
		this.player1TotalHP = player1TotalHP;
		this.player2TotalHP = player2TotalHP;
		this.totalHP = this.player1TotalHP + this.player2TotalHP;

	}
}

module.exports = InitialLog;