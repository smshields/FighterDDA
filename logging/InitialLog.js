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
        this.maxNerfAmount = Constants.MAX_NERF_AMOUNT;
        this.directorChangeScalar = Constants.DIRECTOR_CHANGE_SCALAR;
        this.statFuzziness = Constants.STAT_FUZZINESS;
    }

    initInitialLog(player1TotalHP, player2TotalHP) {
        this.player1TotalHP = player1TotalHP;
        this.player2TotalHP = player2TotalHP;
        this.totalHP = this.player1TotalHP + this.player2TotalHP;
    }

    toJSON() {
        return {
            mode: this.mode,
            targetActions: this.targetActions,
            player1AI: this.player1AI,
            player1TotalHP: this.player1TotalHP,
            player2AI: this.player2AI,
            player2TotalHP: this.player2TotalHP,
            totalHP: this.totalHP,
            seed: this.seed,
            multiScalar: this.multiScalar,
            singleScalar: this.singleScalar,
            healScalar: this.healScalar,
            multiHealScalar: this.multiHealScalar,
            speedScalar: this.speedScalar,
            defenseScalar: this.defenseScalar,
            maxBuffAmount: this.maxBuffAmount,
            maxNerfAmount: this.maxNerfAmount,
            directorChangeScalar: this.directorChangeScalar,
            statFuzziness: this.statFuzziness
        };
    }

}

module.exports = InitialLog;