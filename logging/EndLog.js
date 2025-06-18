const TimeStepLog = require('./TimeStepLog');
const Logger = require('./Logger');

class EndLog {

    constructor(gameState, loser) {
        //used for end-state processesing
        this.timeStepLogs = [];
        this.gameState = gameState;

        //Game outcome data
        this.loser = loser;
        this.totalTimeSteps = gameState.timeStep;
        this.totalActions = gameState.totalPlayerActions;
        this.totalDamageOut = gameState.totalPlayerDamageOut;

        //TODO: Move to player objects
        this.player1DamageOut = gameState.player1Data.damageOut;
        this.player1TotalActions = gameState.player1Data.actions;
        this.player2DamageOut = gameState.player2Data.damageOut;
        this.player2TotalActions = gameState.player2Data.actions;

        //post-game processesing
        this.numDirectorChanges = -1;
        this.numLeadChangesByRatio = -1;
        this.numLeadChangesByValue = -1;
        this.playerActionRatio = -1; //Represents action imbalance (e.g. if one player acts twice as often, return 2)
        this.winningPlayerRemainingHP = -1;
        this.directorStatChangeAverageAbsolute = -1;
        this.directorStatChangeAverageBuff = -1;
        this.directorStatChangeAverageNerf = -1;
        this.winningPlayerLowestCharacterHP = -1;

        //TODO: Unsure on categorization
        this.actionBlocks = 0;
        this.closeDamageCalls = 0;
        this.criticalHeals = 0;
        this.absoluteStatDifference = 0;
    }

    postGameProcess(logger, players) {

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
        this.playerActionRatio = this.calculatePlayerActionRatio();

        //Winning player remaining HP
        this.winningPlayerRemainingHP = this.calculateRemainingHPForWinner();
        this.winningPlayerLowestCharacterHP = this.calculateWinningPlayerLowestCharacterHP();

        //Director Stat Changes
        let directorChangeData = this.calculateAverageDirectorStatChanges();
        this.directorStatChangeAverageAbsolute = directorChangeData.totalAverage;
        this.directorStatChangeAverageBuff = directorChangeData.buffAverage;
        this.directorStatChangeAverageNerf = directorChangeData.nerfAverage;

        //action blocks, damage calls, heals
        this.actionBlocks = this.gameState.actionBlocks;
        this.closeDamageCalls = this.gameState.closeDamageCalls;
        this.criticalHeals = this.gameState.criticalHeals;

        //stat difference
        this.absoluteStatDifference = this.calculateStatDifference(players[0], players[1]);

        return true;
    }

    calculateStatDifference(player1, player2) {

        let player1BaseStatTotal = 0;
        for (let character of player1.characters) {
            player1BaseStatTotal += character.baseStats.HP;
            player1BaseStatTotal += character.baseStats.Attack;
            player1BaseStatTotal += character.baseStats.MagicAttack;
            player1BaseStatTotal += character.baseStats.Defense;
            player1BaseStatTotal += character.baseStats.MagicDefense;
            player1BaseStatTotal += character.baseStats.Speed;
            player1BaseStatTotal += character.baseStats.Luck;
        }

        let player2BaseStatTotal = 0;
        for (let character of player2.characters) {
            player2BaseStatTotal += character.baseStats.HP;
            player2BaseStatTotal += character.baseStats.Attack;
            player2BaseStatTotal += character.baseStats.MagicAttack;
            player2BaseStatTotal += character.baseStats.Defense;
            player2BaseStatTotal += character.baseStats.MagicDefense;
            player2BaseStatTotal += character.baseStats.Speed;
            player2BaseStatTotal += character.baseStats.Luck;
        }

        return Math.abs(player1BaseStatTotal - player2BaseStatTotal);
    }

    calculateWinningPlayerLowestCharacterHP() {
        if (this.loser === 1) {
            return this.gameState.getLowestHPCharacter(2);
        } else if (this.loser === 2) {
            return this.gameState.getLowestHPCharacter(1);
        } else {
            return this.gameState.getLowestHPCharacter(0);
        }
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
        //currently counting per individual buff/nerf, maybe add a mode for 
        //when group buff/nerfs are applied?
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
        let ratio = this.gameState.player1Data.actions / this.gameState.player2Data.actions;
        if (ratio < 1) {
            ratio = 1 / ratio;
        }
        return ratio;
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
            playerActionRatio: this.playerActionRatio,
            winningPlayerRemainingHP: this.winningPlayerRemainingHP,
            directorStatChangeAverageAbsolute: this.directorStatChangeAverageAbsolute,
            directorStatChangeAverageBuff: this.directorStatChangeAverageBuff,
            directorStatChangeAverageNerf: this.directorStatChangeAverageNerf,
            winningPlayerLowestCharacterHP: this.winningPlayerLowestCharacterHP,
            actionBlocks: this.actionBlocks,
            closeDamageCalls: this.closeDamageCalls,
            criticalHeals: this.criticalHeals,
            absoluteStatDifference: this.absoluteStatDifference
        };
    }
}

module.exports = EndLog;