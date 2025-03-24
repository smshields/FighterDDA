const ss = require('simple-statistics');
const Utils = require('../utils/Utils');
const RNG = require('../utils/RNG');

class AIDirector {
    constructor(mode = 'inclusion', targetActions = 100, difficultyAdjustmentScalar = .002, actionThreshold = 0, thresholdAdjustment = 20) {
        this.maxBuffAmount = 60;
        this.maxNerfAmount = 60;
        this.gameState = {};
        this.mode = mode;

        this.balanceMagnitude = 0;
        this.targetActions = targetActions;
        this.difficultyAdjustmentScalar = difficultyAdjustmentScalar;
    }

    getRandomBuffAmount() {
        return Math.floor(RNG.next() * this.maxBuffAmount);
    }

    getRandomNerfAmount() {
        return Math.floor(RNG.next() * this.maxNerfAmount);
    }

    balanceGame(players, log, timeStep, actionQueue) {
        console.log(`[Time Step: ${timeStep}] AI Director is balancing the game...`);

        const player1 = players[0];
        const player2 = players[1];

        const player1Living = player1.characters.filter(char => char.isAlive()).length;
        const player2Living = player2.characters.filter(char => char.isAlive()).length;

        let balanceActions = {};

        //balance for both players in same direction if threshold has been passed and mode is difficulty
        if (this.mode == 'difficulty') {

            if (this.gameState.actionCurrHPData.length >= 2) {
                if (this.gameState.totalPlayerActions >= this.targetActions) {
                  //  this.targetActions = this.gameState.totalPlayerActions+1;
                }
                //once we have two points, start getting line of best fit for prior points via linear regression
                const regression = ss.linearRegression(this.gameState.actionCurrHPData);
                //calculate desired line between most recent point and target point
                const currentTotalHP = this.gameState.player1Data.currentHP + this.gameState.player2Data.currentHP;
                const slope = Utils.safeDivide((this.targetActions - this.gameState.totalPlayerActions ), (0 - currentTotalHP));
                const yIntercept = -1 * (slope * this.targetActions);

                //calculate the next point for both lines
                //const bestFitX = this.gameState.totalPlayerActions + 1;
                const bestFitX = this.targetActions;
                const bestFitY = (regression.m * bestFitX) + regression.b;

                //const targetFitX = this.gameState.totalPlayerActions + 1;
                const targetFitX = this.targetActions;
                const targetFitY = (slope * targetFitX) + yIntercept;

                //calculate the distance between y points
                const yDistance = (targetFitY - bestFitY);

                // for(let i = 0; i < this.gameState.actionCurrHPData.length; i++){
                //     console.log("POINT " + i + ": X - " + this.gameState.actionCurrHPData[i][0] + ", Y - " + this.gameState.actionCurrHPData[i][1]);
                // }

                //multiply yDistance by 2 to get scalar to use in balancing magnitude, as we want to make new points on opposite side of best fit
                this.balanceMagnitude = yDistance;
                console.log("******** BALANCE MAGNITUDE ********* " + this.balanceMagnitude);
            } else {
                console.log("Not enough action data to calculate balance adjustment.");
                return;
            }

            //roll evenly between luck or atk/def to start
            let randomNumber = RNG.next();
            let cumulativeValue = randomNumber;

            //only roll for HP change if players are going too fast
            //if our magnitude is positive, need to nerf. Otherwise, buff
            if (this.balanceMagnitude >= 0) {
                //cap balanceMagnitude to prevent lock states from line of best fit drifting
                this.balanceMagnitude = Math.min(this.balanceMagnitude, 50);
                if (cumulativeValue <= .5) {
                    return this.balanceCurrHP(player1, player2, log, actionQueue);
                    // } else if (cumulativeValue <= .66) {
                    //     this.balanceLuck(player1, player2, log, actionQueue);
                } else {
                    return this.balanceDamage(player1, player2, log, actionQueue);

                }
            } else {
                this.balanceMagnitude = Math.max(this.balanceMagnitude, -50);
                // if (cumulativeValue <= .33) {
                //     this.balanceLuck(player1, player2, log, actionQueue);
                // } else 
                if (cumulativeValue <= .5) {
                    return this.balanceCurrHP(player1, player2, log, actionQueue);
                } else {
                    return this.balanceDamage(player1, player2, log, actionQueue);
                }
            }

        }

        if (this.mode == 'inclusion') {
            let losingPlayer = null;
            let winningPlayer = null;

            const player1LivingRatio = player1Living / player1.characters.length;
            const player2LivingRatio = player2Living / player2.characters.length;

            let player1WinValue = Utils.map(player1LivingRatio + this.gameState.player1Data.hpRatio, 0, 2, 0, 1);
            let player2WinValue = Utils.map(player2LivingRatio + this.gameState.player2Data.hpRatio, 0, 2, 0, 1);

            if (player1WinValue > player2WinValue) {
                losingPlayer = player2;
                winningPlayer = player1;
            } else if (player1WinValue < player2WinValue) {
                losingPlayer = player1;
                winningPlayer = player2;
            }

            balanceActions['hp'] = Math.abs(player1WinValue - player2WinValue);

            let slowPlayer = null;
            let fastPlayer = null;

            let player1SpeedValue = Utils.safeDivide(this.gameState.player1Data.actions, this.gameState.totalPlayerActions);
            let player2SpeedValue = Utils.safeDivide(this.gameState.player2Data.actions, this.gameState.totalPlayerActions);

            if (player1SpeedValue > player2SpeedValue) {
                slowPlayer = player2;
                fastPlayer = player1;
            } else if (player1SpeedValue < player2SpeedValue) {
                slowPlayer = player1;
                fastPlayer = player2;
            }

            balanceActions['speed'] = Math.abs(player1SpeedValue - player2SpeedValue);

            let unluckyPlayer = null;
            let luckyPlayer = null;

            let player1LuckValue = Utils.safeDivide(this.gameState.player1Data.damageOut, this.gameState.totalPlayerDamageOut);
            let player2LuckValue = Utils.safeDivide(this.gameState.player2Data.damageOut, this.gameState.totalPlayerDamageOut);

            if (player1LuckValue > player2LuckValue) {
                unluckyPlayer = player2;
                luckyPlayer = player1;
            } else if (player1LuckValue < player2LuckValue) {
                unluckyPlayer = player1;
                luckyPlayer = player2;
            }

            balanceActions['luck'] = Math.abs(player1LuckValue - player2LuckValue);

            let valueSum = balanceActions['hp'] + balanceActions['luck'] + balanceActions['speed'];

            if (valueSum == 0) {
                console.log("AI Director - no imbalanced state found! Not adding actions to the queue.");
                return;
            }

            //update values to scale to a 0-1 distribution
            balanceActions['hp'] = Utils.map(balanceActions['hp'], 0, valueSum, 0, 1);
            balanceActions['luck'] = Utils.map(balanceActions['luck'], 0, valueSum, 0, 1);
            balanceActions['speed'] = Utils.map(balanceActions['speed'], 0, valueSum, 0, 1);

            let randomNumber = RNG.next();
            let cumulativeValue = 0;

            cumulativeValue += balanceActions['hp'];
            if (randomNumber < cumulativeValue) {
                this.balanceHP(winningPlayer, losingPlayer, log, actionQueue);
                return;
            }

            cumulativeValue += balanceActions['luck'];
            if (randomNumber < cumulativeValue) {
                this.balanceLuck(luckyPlayer, unluckyPlayer, log, actionQueue);
                return;
            }

            cumulativeValue += balanceActions['speed'];
            if (randomNumber < cumulativeValue) {
                this.balanceSpeed(fastPlayer, slowPlayer, log, actionQueue);
                return;
            }
        }
    }

    balanceDamage(player1, player2, log, actionQueue) {
        //check for living characters
        const player1LivingCharacters = player1.characters.filter(char => char.isAlive());
        const player2LivingCharacters = player2.characters.filter(char => char.isAlive());

        if (player1LivingCharacters.length === 0 || player2LivingCharacters === 0) {
            console.log("AI Director: One team is defeated, no need to balance.");
            return;
        }


        //get raw amount to balance
        const rawStatChangeAmount = this.getRandomBuffAmount();
        //buffer against the magnitude of the difference between target and desired
        const statChange = rawStatChangeAmount * Math.abs(this.balanceMagnitude) * this.difficultyAdjustmentScalar;
        //Concatenate character arrays as we are targeting all characters
        const targets = player1LivingCharacters.concat(player2LivingCharacters);
        //Add player strings together
        const playerNum = player1LivingCharacters[0].player + ", " + player2LivingCharacters[0].player;

        let randomNumber = RNG.next();
        let cumulativeValue = 0;
        //if actionChangeDifference positive, nerf
        if (this.balanceMagnitude <= 0) {
            let buffAction = {};
            if (randomNumber <= .6) {
                const buffAction = {
                    type: 'buff',
                    targets: targets,
                    stats: ['Attack'],
                    amount: statChange,
                    playerNum: playerNum
                }
                return buffAction;
                //actionQueue.push(buffAction);
            } else {
                const buffAction = {
                    type: 'nerf',
                    targets: targets,
                    stats: ['Defense'],
                    amount: statChange,
                    playerNum: playerNum
                }
                return buffAction;
                //actionQueue.push(buffAction);
            }

        } else { //negative, buff
            if (randomNumber <= .4) {
                const nerfAction = {
                    type: 'nerf',
                    targets: targets,
                    stats: ['Attack'],
                    amount: statChange,
                    playerNum: playerNum
                }
                return nerfAction;
                //actionQueue.push(nerfAction);
            } else {
                const nerfAction = {
                    type: 'buff',
                    targets: targets,
                    stats: ['Defense'],
                    amount: statChange,
                    playerNum: playerNum
                }
                return nerfAction;
                //actionQueue.push(nerfAction);
            }
        }
    }
    balanceCurrHP(player1, player2, log, actionQueue) {
        //check for living characters
        const player1LivingCharacters = player1.characters.filter(char => char.isAlive());
        const player2LivingCharacters = player2.characters.filter(char => char.isAlive());

        if (player1LivingCharacters.length === 0 || player2LivingCharacters === 0) {
            console.log("AI Director: One team is defeated, no need to balance.");
            return;
        }


        //get raw amount to balance
        const rawStatChangeAmount = this.getRandomBuffAmount();
        //buffer against the magnitude of the difference between target and desired
        const statChange = rawStatChangeAmount * Math.abs(this.balanceMagnitude) * this.difficultyAdjustmentScalar;
        //Concatenate character arrays as we are targeting all characters
        const targets = player1.characters.concat(player2.characters);
        //Add player strings together
        const playerNum = player1LivingCharacters[0].player + ", " + player2LivingCharacters[0].player;

        if (this.balanceMagnitude <= 0) {
            const healAction = {
                type: 'heal',
                targets: targets,
                stats: ['currentHP'],
                amount: statChange,
                playerNum: playerNum
            }
            return healAction;
            //actionQueue.push(healAction);
        }

        else { //negative, buff
            const damageAction = {
                type: 'damage',
                targets: targets,
                stats: ['currentHP'],
                amount: statChange,
                playerNum: playerNum
            }
            return damageAction;
            //actionQueue.push(damageAction);
        }

    }

    balanceHP(winningPlayer, losingPlayer, log, actionQueue) {
        //check for lviing characters
        const aliveWinningCharacters = winningPlayer.characters.filter(char => char.isAlive());
        const aliveLosingCharacters = losingPlayer.characters.filter(char => char.isAlive());

        if (aliveLosingCharacters.length === 0 || aliveWinningCharacters.length === 0) {
            console.log("AI Director: One team is defeated, no need to balance.");
            return;
        }

        const winningPlayerNum = aliveWinningCharacters[0].player;
        const losingPlayerNum = aliveLosingCharacters[0].player;

        //specify stats to buff and values of buff
        const statsToBuff = ['Attack', 'Defense'];
        const statsToNerf = ['Attack', 'Defense'];
        const buffAmount = this.getRandomBuffAmount();
        const nerfAmount = this.getRandomNerfAmount();

        //format actions
        const buffAction = {
            type: 'buff',
            targets: aliveLosingCharacters,
            stats: statsToBuff,
            amount: buffAmount,
            playerNum: losingPlayerNum
        };
        const nerfAction = {
            type: 'nerf',
            targets: aliveWinningCharacters,
            stats: statsToNerf,
            amount: nerfAmount,
            playerNum: winningPlayerNum
        };

        const randomNumber = RNG.next();

        //randomly choose to buff, nerf, or both
        if (randomNumber <= .33) { //buff
            actionQueue.push(buffAction);
        } else if (randomNumber <= .66) { //nerf
            actionQueue.push(nerfAction);
        } else { //both
            actionQueue.push(buffAction);
            actionQueue.push(nerfAction);
        }
    }
    balanceSpeed(fastPlayer, slowPlayer, log, actionQueue) {
        //check for lviing characters
        const aliveFastCharacters = fastPlayer.characters.filter(char => char.isAlive());
        const aliveSlowCharacters = slowPlayer.characters.filter(char => char.isAlive());

        if (aliveFastCharacters.length === 0 || aliveSlowCharacters.length === 0) {
            console.log("AI Director: One team is defeated, no need to balance.");
            return;
        }

        const fastPlayerNum = aliveFastCharacters[0].player;
        const slowPlayerNum = aliveSlowCharacters[0].player;

        //specify stats to buff and values of buff
        const statsToBuff = ['Speed'];
        const statsToNerf = ['Speed'];
        const buffAmount = this.getRandomBuffAmount();
        const nerfAmount = this.getRandomNerfAmount();

        //format actions
        const buffAction = {
            type: 'buff',
            targets: aliveSlowCharacters,
            stats: statsToBuff,
            amount: buffAmount,
            playerNum: slowPlayerNum
        };
        const nerfAction = {
            type: 'nerf',
            targets: aliveFastCharacters,
            stats: statsToNerf,
            amount: nerfAmount,
            playerNum: fastPlayerNum
        };

        const randomNumber = RNG.next();

        //randomly choose to buff, nerf, or both
        if (randomNumber <= .33) { //buff
            actionQueue.push(buffAction);
        } else if (randomNumber <= .66) { //nerf
            actionQueue.push(nerfAction);
        } else { //both
            actionQueue.push(buffAction);
            actionQueue.push(nerfAction);
        }
    }
    balanceLuck(luckyPlayer, unluckyPlayer, log, actionQueue) {
        //check for lviing characters
        const aliveLuckyCharacters = luckyPlayer.characters.filter(char => char.isAlive());
        const aliveUnluckyCharacters = unluckyPlayer.characters.filter(char => char.isAlive());

        if (aliveLuckyCharacters.length === 0 || aliveUnluckyCharacters.length === 0) {
            console.log("AI Director: One team is defeated, no need to balance.");
            return;
        }

        if (this.mode == 'inclusion') {

            const luckyPlayerNum = aliveLuckyCharacters[0].player;
            const unluckyPlayerNum = aliveUnluckyCharacters[0].player;

            //specify stats to buff and values of buff
            const statsToBuff = ['Luck'];
            const statsToNerf = ['Luck'];
            const buffAmount = this.getRandomBuffAmount();
            const nerfAmount = this.getRandomNerfAmount();

            //format actions
            const buffAction = {
                type: 'buff',
                targets: aliveUnluckyCharacters,
                stats: statsToBuff,
                amount: buffAmount,
                playerNum: unluckyPlayerNum
            };
            const nerfAction = {
                type: 'nerf',
                targets: aliveLuckyCharacters,
                stats: statsToNerf,
                amount: nerfAmount,
                playerNum: luckyPlayerNum
            };

            const randomNumber = RNG.next();

            //randomly choose to buff, nerf, or both
            if (randomNumber <= .33) { //buff
                actionQueue.push(buffAction);
            } else if (randomNumber <= .66) { //nerf
                actionQueue.push(nerfAction);
            } else { //both
                actionQueue.push(buffAction);
                actionQueue.push(nerfAction);
            }
        } else if (this.mode == 'difficulty') {
            const statsToBalance = ['Luck'];
            //get raw amount to balance
            const rawStatChangeAmount = this.getRandomBuffAmount();
            //buffer against the magnitude of the difference between target and desired
            const statChange = rawStatChangeAmount * Math.abs(this.balanceMagnitude) * this.difficultyAdjustmentScalar;
            //Concatenate character arrays as we are targeting all characters
            const targets = aliveLuckyCharacters.concat(aliveUnluckyCharacters);
            //Add player strings together
            const playerNum = aliveLuckyCharacters[0].player + ", " + aliveUnluckyCharacters[0].player;


            //if actionChangeDifference positive, nerf
            if (this.balanceMagnitude <= 0) {
                const buffAction = {
                    type: 'buff',
                    targets: targets,
                    stats: statsToBalance,
                    amount: statChange,
                    playerNum: playerNum
                }
                actionQueue.push(buffAction);
            } else { //negative, buff
                const nerfAction = {
                    type: 'nerf',
                    targets: targets,
                    stats: statsToBalance,
                    amount: statChange,
                    playerNum: playerNum
                }
                actionQueue.push(nerfAction);
            }
        } else {
            console.log("No valid balancing mode specified!");
            return;
        }
    }

}

module.exports = AIDirector;