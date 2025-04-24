const ss = require('simple-statistics');
const Utils = require('../utils/Utils');
const RNG = require('../utils/RNG');
const Constants = require('../utils/Constants');
const Logger = require('../logging/Logger');

class AIDirector {
    constructor(
        mode = 'inclusion',
        targetActions = Constants.TARGET_ACTIONS,
        difficultyAdjustmentScalar = Constants.DIFFICULTY_ADJUSTMENT_SCALAR,
        actionThreshold = 0,
        thresholdAdjustment = 20
    ) {
        this.maxBuffAmount = Constants.MAX_BUFF_AMOUNT;
        this.maxNerfAmount = Constants.MIN_BUFF_AMOUNT;
        this.gameState = {};
        this.mode = mode;

        this.logger = new Logger();

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

    balanceGame(players) {
        let balanceMessage = `AI Director is balancing. `;

        const player1 = players[0];
        const player2 = players[1];

        const player1Living = player1.characters.filter(char => char.isAlive()).length;
        const player2Living = player2.characters.filter(char => char.isAlive()).length;

        let balanceActions = {};

        //balance for both players in same direction if threshold has been passed and mode is difficulty
        if (this.mode == 'difficulty') {

            if (this.gameState.actionCurrHPData.length >= 2) {
                //return to this if we still are having major problems... see case if x is negative)
                if (this.gameState.totalPlayerActions >= this.targetActions) {
                   this.targetActions = this.gameState.totalPlayerActions+1;
                }

                //TODO: Points should be measured between Director actions, not player actions. Or be settings dependent. requires tinkering with gameState.actionCurrHPData


                //Calculate current trend line based on prior currentHP vs. Action Count Points
                const regression = ss.linearRegression(this.gameState.actionCurrHPData);
                const currentSlope = regression.m;
                const currentYIntercept = regression.b;
                const currentX1 = this.gameState.totalPlayerActions;
                const currentY1 = (currentSlope * currentX1) + currentYIntercept;
                const newCurrentX = this.gameState.totalPlayerActions + 1; //new projected X is the next action executed
                const newCurrentY = (currentSlope * newCurrentX) + currentYIntercept; //calculate new Y from previous values

                //Calculate current target line based on y=0 intercept, remaining actions, and current hp/action
                const targetX1 = this.gameState.totalPlayerActions;
                const targetY1 = this.gameState.currentHP;
                const targetX2 = this.targetActions;
                const targetY2 = 0; //game should end at targetActions

                const targetSlope = Utils.safeDivide((targetX2 - targetX1), (targetY2 - targetY1)); //get slope of target line
                const targetYIntercept = -1 * (targetSlope * targetX2); //use target point (x is target actions, y is 0) to get slope
                const newTargetX = this.gameState.totalPlayerActions + 1; //new projected X is the next action executed
                const newTargetY = (targetSlope * newTargetX) + targetYIntercept;

                //Approximate new Y value based on next X value using new Y points, gives the desired change of HP we want to see
                const yChange = newTargetY - newCurrentY;
                let currentAvgYSum = 0;
                for (let point of this.gameState.actionCurrHPData) {
                    currentAvgYSum += point[1];
                }
                currentAvgYSum = currentAvgYSum / this.gameState.actionCurrHPData.length;

                const desiredY = currentAvgYSum + yChange;
                //HP Change we want to see for each action going forward
                const desiredYChange = desiredY - newCurrentY; //negative = buff to make faster, positive = nerf to make slower

                const balanceMagnitude = desiredYChange; //indicates the change in HP we'd need to see to hit new Y point

                const isBuff = (balanceMagnitude < 0);

                let randomNumber = RNG.next();
                let cumulativeValue = randomNumber;

                //we need to consider heals and damage per action to translate to final HP change

                //calculate current DPA derived from stats. Always positive as DPA can never be negative (always mapped to a positive range)
                let currentAvgDPA = this.calculateAverageDamagePerAction(player1, player2);
                //get desired DPA we'd need to have to meet our balance magnitude change;
                //calculate current DPA derived from ratios of hp changes to current average DPA
                let desiredAvgDPA = desiredYChange; //can only be negative
                //get average stat change weed need per living character to get desired DPA
                let statChangeMagnitude = this.calculateRawStatChange(currentAvgDPA, desiredAvgDPA);

                //TODO: change this to utility rolls for other things depending on gamestate (big feature add - HP, damage, luck, speed...)
                return this.balanceDamage(player1, player2, statChangeMagnitude, isBuff);

            } else {
                balanceMessage += `Not enough action data to calculate balance adjustment.`;
                this.logger.logAction(balanceMessage);
                return;
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
                balanceMessage += `No imbalanced state found! No action pushed to queue.`;
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

    calculateDesiredDamagePerAction(averageDPA, currentHPChangePerAction, desiredHPChangePerAction) {
        return (averageDPA * desiredHPChangePerAction) / currentHPChangePerAction;
    }

    calculateAverageHealPerAction(player1, player2) {
        const player1LivingCharacters = player1.characters.filter(char => char.isAlive());
        const player2LivingCharacters = player2.characters.filter(char => char.isAlive());

        if (player1LivingCharacters.length === 0 || player2LivingCharacters === 0) {
            this.logger.logError("One player has been defeated; no need to calculate average heal per action for balancing.");
            return;
        }

        const allLivingCharacters = player1LivingCharacters.concat(player2LivingCharacters);

        const healers = [];
        for(let character of allLivingCharacters){
            for(let action of character.actions){
                if(action.type === 'heal'||action.type === 'multi_heal'){
                    healers.push(character);
                }
            }
        }

        if(healers.length === 0){
            this.logger.logError("AI Director: There are no characters left to use a healing action! Healing Per Action is 0.");
        }

        let totalDefense = 0;
        let totalMagicDefense = 0;

        //calculate total avg heal
        for (let healer of healers) {
            totalDefense += healer.stats.Defense;
            totalMagicDefense += healer.stats.MagicDefense;
        }

        let avgDefense = totalDefense / healers.length;
        let avgMagicDefense = totalMagicDefense / healers.length;



        let averageHeal = ((avgDefense + avgMagicDefense) / 2) * Constants.SINGLE_TARGET_SCALAR;

        return averageHeal;

    }

    calculateRawStatChange(currentDamagePerAction, desiredAverageDamagePerAction) {
        let damageDifference = currentDamagePerAction - desiredAverageDamagePerAction;
        return Utils.mapDamageToRawDamage(damageDifference, Constants.SINGLE_TARGET_SCALAR);

    }

    calculateAverageDamagePerAction(player1, player2) {
        //TODO: I can probably make this cleaner.
        //TODO: refactor out living character calls/requests.
        const player1LivingCharacters = player1.characters.filter(char => char.isAlive());
        const player2LivingCharacters = player2.characters.filter(char => char.isAlive());

        if (player1LivingCharacters.length === 0 || player2LivingCharacters === 0) {
            this.logger.logError("One player has been defeated; no need to calculate average damage per action for balancing.");
            return;
        }

        let player1AverageAttack = 0;
        let player1AverageMagicAttack = 0;
        let player1AverageDefense = 0;
        let player1AverageMagicDefense = 0;

        for (let character of player1LivingCharacters) {
            player1AverageAttack += character.stats.Attack;
            player1AverageMagicAttack += character.stats.MagicAttack;
            player1AverageDefense += character.stats.Defense;
            player1AverageMagicDefense += character.stats.MagicDefense;
        }

        player1AverageAttack = player1AverageAttack / player1LivingCharacters.length;
        player1AverageDefense = player1AverageDefense / player1LivingCharacters.length;
        player1AverageMagicAttack = player1AverageMagicAttack / player1LivingCharacters.length;
        player1AverageMagicDefense = player1AverageMagicDefense / player1LivingCharacters.length;

        let player2AverageAttack = 0;
        let player2AverageMagicAttack = 0;
        let player2AverageDefense = 0;
        let player2AverageMagicDefense = 0;

        for (let character of player2LivingCharacters) {
            player2AverageAttack += character.stats.Attack;
            player2AverageMagicAttack += character.stats.MagicAttack;
            player2AverageDefense += character.stats.Defense;
            player2AverageMagicDefense += character.stats.MagicDefense;
        }

        player2AverageAttack = player2AverageAttack / player2LivingCharacters.length;
        player2AverageDefense = player2AverageDefense / player2LivingCharacters.length;
        player2AverageMagicAttack = player2AverageMagicAttack / player2LivingCharacters.length;
        player2AverageMagicDefense = player2AverageMagicDefense / player2LivingCharacters.length;


        //attack - defense, normalize, curve, scalar. calculate for single attack scalar (multi will be less than or equal to)
        let player1RawAvgDPA = ((player1AverageAttack - player2AverageDefense) + (player1AverageMagicAttack - player2AverageMagicDefense)) / 2;
        let player1AvgDPA = Utils.mapRawDamageToDamage(player1RawAvgDPA, Constants.SINGLE_TARGET_SCALAR);

        //repeat for player 2
        let player2RawAvgDPA = ((player2AverageAttack - player1AverageDefense) + (player2AverageMagicAttack - player1AverageMagicDefense)) / 2;
        let player2AvgDPA = Utils.mapRawDamageToDamage(player2RawAvgDPA, Constants.SINGLE_TARGET_SCALAR);

        //get average between both player's potential DPA
        let avgDPA = (player1AvgDPA + player2AvgDPA) / 2;



        //Need to consider heal volume to get accurateDPA
        avgDPA = avgDPA - this.calculateAverageHealPerAction(player1, player2);
        return avgDPA;
    }

    balanceDamage(player1, player2, statChange, isBuff) { //rawStat amount will be positive or negative already
        //check for living characters
        const player1LivingCharacters = player1.characters.filter(char => char.isAlive());
        const player2LivingCharacters = player2.characters.filter(char => char.isAlive());

        if (player1LivingCharacters.length === 0 || player2LivingCharacters === 0) {
            logger.logAction("AI Director: One team is defeated, no need to balance damage.");
            return;
        }

        //TODO: Should this also account for targeted (e.g. one player) buffs?
        const targets = player1LivingCharacters.concat(player2LivingCharacters);
        //Add player strings together
        const playerNum = player1LivingCharacters[0].player + ", " + player2LivingCharacters[0].player;

        let randomNumber = RNG.next();
        let cumulativeValue = 0;

        //
        if (isBuff) { //negative, buff damage output
            let buffAction = {};
            if (randomNumber <= .5) {
                const buffAction = {
                    type: 'buff',
                    targets: targets,
                    stats: ['Attack', 'MagicAttack'],
                    amount: statChange,
                    playerNum: playerNum
                }
                return buffAction;
                this.gameState.actionQueue.push(buffAction);
            } else {
                const nerfAction = {
                    type: 'nerf',
                    targets: targets,
                    stats: ['Defense', 'MagicDefense'],
                    amount: statChange,
                    playerNum: playerNum
                }
                return nerfAction;
                this.gameState.actionQueue.push(nerfAction);
            }

        } else { //negative, nerf damage output
            if (randomNumber <= .5) {
                const nerfAction = {
                    type: 'nerf',
                    targets: targets,
                    stats: ['Attack', 'MagicAttack'],
                    amount: statChange,
                    playerNum: playerNum
                }
                return nerfAction;
                actionQueue.push(nerfAction);
            } else {
                const buffAction = {
                    type: 'buff',
                    targets: targets,
                    stats: ['Defense', 'MagicDefense'],
                    amount: statChange,
                    playerNum: playerNum
                }
                return buffAction;
                actionQueue.push(buffAction);
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
        } else { //negative, buff
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