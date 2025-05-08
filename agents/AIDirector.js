const ss = require('simple-statistics');
const Utils = require('../utils/Utils');
const RNG = require('../utils/RNG');
const Constants = require('../utils/Constants');
const Logger = require('../logging/Logger');
const DirectorAction = require('../core/DirectorAction');

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


    //TODO: Return an array of actions, not just one
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
                    console.log("reached target action increment **************");
                    console.log(this.targetActions);
                    console.log(this.gameState.totalPlayerActions);
                    this.targetActions = this.gameState.totalPlayerActions + 5;
                }

                //TODO: Refactor this into methods to reduce length of code in method.
                //Get LoB for Player 1, current average sum
                let p1LineOfBestFitData = [];
                let p1CurrentAvgSum = 0;

                let p1TempData = this.gameState.actionCurrHPData.slice(-10);
                for (let point of p1TempData) {
                    p1CurrentAvgSum += point[1];
                    p1LineOfBestFitData.push([point[0], point[1]]);
                }

                p1CurrentAvgSum = p1CurrentAvgSum / p1LineOfBestFitData.length;

                let p1LineOfBestFit = ss.linearRegression(p1LineOfBestFitData);
                let p1LineOfBestFitSlope = p1LineOfBestFit.m;
                let p1LineOfBestFitYIntercept = p1LineOfBestFit.b;

                //Get Target line for Player 1
                let p1TargetX1 = 0;
                let p1TargetY1 = this.gameState.player1Data.currentHP;
                let p1TargetX2 = this.targetActions - this.gameState.totalPlayerActions;
                let p1TargetY2 = 0;

                let p1TargetSlope = Utils.safeDivide((p1TargetY2 - p1TargetY1), (p1TargetX2 - p1TargetX1));
                let p1TargetYIntercept = p1TargetY1;

                //Get next point on line for LoB, Target for Player 1
                let p1LineOfBestFitNextX = this.gameState.totalPlayerActions + 1;
                let p1LineOfBestFitNextY = (p1LineOfBestFitSlope * p1LineOfBestFitNextX) + p1LineOfBestFitYIntercept;
                let p1LineOfBestFitY = (p1LineOfBestFitSlope * this.gameState.totalPlayerActions) + p1LineOfBestFitYIntercept;

                let p1TargetNextX = this.gameState.totalPlayerActions + 1;
                let p1TargetNextY = p1TargetSlope + p1TargetY1;

                //predict where next Y needs to be based on both points
                let p1YChange = p1TargetNextY - p1LineOfBestFitNextY;
                let p1DesiredY = p1CurrentAvgSum + p1YChange;
                let p1DesiredYChange = p1DesiredY - p1LineOfBestFitNextY;

                let p1BalanceMagnitude = p1DesiredYChange;



                //Get LoB for Player 2, current average sum
                let p2LineOfBestFitData = [];
                let p2CurrentAvgSum = 0;

                let p2TempData = this.gameState.actionCurrHPData.slice(-10);
                for (let point of p2TempData) {
                    p2CurrentAvgSum += point[2];
                    p2LineOfBestFitData.push([point[0], point[2]]);
                }

                p2CurrentAvgSum = p2CurrentAvgSum / p2LineOfBestFitData.length;

                let p2LineOfBestFit = ss.linearRegression(p2LineOfBestFitData);
                let p2LineOfBestFitSlope = p2LineOfBestFit.m;
                let p2LineOfBestFitYIntercept = p2LineOfBestFit.b;

                //Get Target line for Player 1
                let p2TargetX1 = 0;
                let p2TargetY1 = this.gameState.player2Data.currentHP;
                let p2TargetX2 = this.targetActions - this.gameState.totalPlayerActions;
                let p2TargetY2 = 0;

                let p2TargetSlope = Utils.safeDivide((p2TargetY2 - p2TargetY1), (p2TargetX2 - p2TargetX1));
                let p2TargetYIntercept = p2TargetY1;
                let p2LineOfBestFitY = (p2LineOfBestFitSlope * this.gameState.totalPlayerActions) + p2LineOfBestFitYIntercept;

                //Get next point on line for LoB, Target for Player 1
                let p2LineOfBestFitNextX = this.gameState.totalPlayerActions + 1;
                let p2LineOfBestFitNextY = (p2LineOfBestFitSlope * p2LineOfBestFitNextX) + p2LineOfBestFitYIntercept;

                let p2TargetNextX = 1;
                let p2TargetNextY = p2TargetSlope + p2TargetYIntercept;

                //predict where next Y needs to be based on both points
                let p2YChange = p2TargetNextY - p2LineOfBestFitNextY;
                let p2DesiredY = p2CurrentAvgSum + p2YChange;
                let p2DesiredYChange = p2DesiredY - p2LineOfBestFitNextY;

                let p2BalanceMagnitude = p2DesiredYChange;

                //if balance magnitude is negative - nerf player (lower their defense, raise opponents offense).
                //if balance magnitude is positive - buff player (raise their defense, lower opponents offense).

                //balance magnitude is representing damage per action needed to change from current line of best fit prediction
                //since we are applying two balancing actions (one per player), we can safely divide magnitude in half
                //need to convert DPA to relevant stat changes for damage balancing

                //After doing some paper math, this is: change = desiredDPA - currentDPA
                //Which is: change = desiredY - lineOfBestFitNextY

                let p1StatChangeMagnitude = this.calculateRawStatChange(p1LineOfBestFitNextY, p1DesiredY);
                let p2StatChangeMagnitude = this.calculateRawStatChange(p2LineOfBestFitNextY, p2DesiredY);

                let randomNumber = RNG.next();
                let cumulativeValue = .5;

                //TODO: Fix this up to be cleaner, allow more adjustments
                //TODO: Do I need to divide stat change magnitudes in half since I'm making two adjustments? 
                //TODO: Update other Game functions so that it is expecting an array of balancing actions


                let directorActions = [];

                //P1 decide: buff defense or nerf P2 Attack; nerf defense or buff P2 Attack;
                let directorActionP1 = {};

                if (randomNumber < cumulativeValue) {
                    directorActionP1 = this.adjustAttack(player2, -1 * p1StatChangeMagnitude);
                } else {
                    directorActionP1 = this.adjustDefense(player1, p1StatChangeMagnitude);
                }

                directorActions.push(directorActionP1);

                //P2 decide
                randomNumber = RNG.next();

                let directorActionP2 = {};
                if (randomNumber < cumulativeValue) {
                    directorActionP2 = this.adjustAttack(player1, -1 * p2StatChangeMagnitude);
                } else {
                    directorActionP2 = this.adjustDefense(player2, p2StatChangeMagnitude);
                }

                directorActions.push(directorActionP2);

                //Debugging - How are we calculating magnitude of stat changes?

                // console.log("GLOBAL DATA: ");
                // console.log("TARGET ACTIONS: " + this.targetActions);
                // console.log("TOTAL PLAYER ACTIONS: " + this.gameState.totalPlayerActions);

                // console.log("LINE OF BEST FIT DATA P1: ");
                // console.log(p1LineOfBestFitData);

                // console.log("CHANGE MAGNITUDE P1: " + p1StatChangeMagnitude);
                // console.log("CURRENT AVERAGE Y SUM P1: " + p1CurrentAvgSum);
                // console.log("CURRENT SLOPE P1: " + p1LineOfBestFitSlope);
                // console.log("CURRENT YINTERCEPT P1: " + p1LineOfBestFitYIntercept);
                // console.log("CURRENT Y P1: " + p1LineOfBestFitY);
                // console.log("NEXT CURRENT Y P1: " + p1LineOfBestFitNextY);
                // console.log("TARGET X P1: " + p1TargetX1);
                // console.log("TARGET Y P1: " + p1TargetY1);
                // console.log("TARGET X2 P1: " + p1TargetX2);
                // console.log("TARGET Y2 P1: " + p1TargetY2);
                // console.log("TARGET P1 SLOPE: " + p1TargetSlope);
                // console.log("NEXT TARGET Y P1: " + p1TargetNextY);
                // console.log("DESIRED Y P1: " + p1DesiredY);
                // console.log("P1 DESIRED Y CHANGE: " + p1DesiredYChange);
                // console.log("P1 CURRENT HEALTH: " + this.gameState.player1Data.currentHP);

                // console.log("LINE OF BEST FIT DATA P2: ");
                // console.log(p2LineOfBestFitData);

                // console.log("CHANGE MAGNITUDE P2: " + p2StatChangeMagnitude);
                // console.log("CURRENT AVERAGE Y SUM P2: " + p2CurrentAvgSum);
                // console.log("CURRENT SLOPE P2: " + p2LineOfBestFitSlope);
                // console.log("CURRENT YINTERCEPT P2: " + p2LineOfBestFitYIntercept);
                // console.log("CURRENT Y P2: " + p2LineOfBestFitY);
                // console.log("NEXT CURRENT Y P2: " + p2LineOfBestFitNextY);
                // console.log("TARGET X P2: " + p1TargetX1);
                // console.log("TARGET Y P2: " + p2TargetY1);
                // console.log("TARGET X2 P2: " + p2TargetX2);
                // console.log("TARGET Y2 P2: " + p2TargetY2);
                // console.log("TARGET P2 SLOPE: " + p2TargetSlope);
                // console.log("NEXT TARGET Y P2: " + p2TargetNextY);
                // console.log("CURRENT AVERAGE Y SUM P2: " + p2CurrentAvgSum);
                // console.log("DESIRED Y P2: " + p2DesiredY);
                // console.log("P2 DESIRED Y CHANGE: " + p2DesiredYChange);
                // console.log("P2 CURRENT HEALTH: " + this.gameState.player2Data.currentHP);



                return directorActions;

                //TODO: change this to utility rolls for other things depending on gamestate (big feature add - HP, damage, luck, speed...)

            } else {
                balanceMessage += `Not enough action data to calculate balance adjustment.`;
                this.logger.logAction(balanceMessage);
                return [];
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
        for (let character of allLivingCharacters) {
            for (let action of character.actions) {
                if (action.type === 'heal' || action.type === 'multi_heal') {
                    healers.push(character);
                }
            }
        }

        if (healers.length === 0) {
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

    calculateRawStatChange(currentDamagePerAction, desiredDamagePerAction) {
        let damageDifference = desiredDamagePerAction - currentDamagePerAction;
        let changeDirection = 1;
        if (damageDifference < 0) {
            changeDirection = -1;
        }
        return Utils.round(changeDirection * Utils.mapDamageToRawDamage(damageDifference, Constants.SINGLE_TARGET_SCALAR));

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

    adjustAttack(player, statChange) {
        let playerLivingCharacters = player.characters.filter(char => char.isAlive());
        if (playerLivingCharacters.length === 0) {
            this.logger.logAction("AI Director - AdjustAttack: One team is defeated, no need to balance damage.");
            return;
        }

        let playerNum = player.playerNumber;
        let stats = ['Attack', 'MagicAttack'];
        let type = "";
        if (statChange >= 0) {
            type = "buff";
        } else {
            type = "nerf";
        }

        return new DirectorAction(type, playerNum, playerLivingCharacters, stats, statChange);
    }

    adjustDefense(player, statChange) {
        let playerLivingCharacters = player.characters.filter(char => char.isAlive());

        if (playerLivingCharacters.length === 0) {
            this.logger.logAction("AI Director: One team is defeated, no need to balance damage.");
            return;
        }

        let playerNum = player.playerNumber;
        let type = "";
        if (statChange >= 0) {
            type = "buff";
        } else {
            type = "nerf";
        }

        let directorAction = {
            type: type,
            targets: playerLivingCharacters,
            stats: ['Defense', 'MagicDefense'],
            amount: statChange / 2,
            playerNum: playerNum
        }

        return directorAction;
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