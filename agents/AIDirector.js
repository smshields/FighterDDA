const ss = require('simple-statistics');
const Utils = require('../utils/Utils');
const RNG = require('../utils/RNG');
const Constants = require('../utils/Constants');
const Logger = require('../logging/Logger');
const DirectorAction = require('../core/DirectorAction');

class AIDirector {
    constructor(
        mode = 'inclusion',
        difficultyMode = Constants.DIFFICULTY_BALANCE_MODE,
        targetActions = Constants.TARGET_ACTIONS,
        hpDamageAdjustmentScalar = Constants.HP_DAMAGE_ADJUSTMENT_SCALAR,
        actionThreshold = 0,
        thresholdAdjustment = 20
    ) {
        this.maxBuffAmount = Constants.MAX_BUFF_AMOUNT;
        this.maxNerfAmount = Constants.MAX_NERF_AMOUNT;
        this.gameState = {};
        this.mode = mode;
        this.difficultyMode = difficultyMode;

        this.logger = new Logger();

        this.balanceMagnitude = 0;
        this.targetActions = targetActions;
        this.hpDamageAdjustmentScalar = hpDamageAdjustmentScalar;

        // console.log("##########################################################");
        // console.log("TARGET ACTIONS: " + this.targetActions);
        // console.log("CONST TARGET ACTIONS: " + Constants.TARGET_ACTIONS);
        // console.log("BASE CONST TARGET ACTIONS: " + Constants.BASE_TARGET_ACTIONS);
        // console.log("##########################################################");
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
        if (this.mode === 'difficulty') {

            if (this.gameState.actionCurrHPData.length >= 2) {
                //return to this if we still are having major problems... see case if x is negative)
                if (this.gameState.totalPlayerActions >= this.targetActions) {
                    this.targetActions = this.gameState.totalPlayerActions + 5;
                }
            }

            if (this.difficultyMode === 'player') {
                // ***** STAT APPROACH *****

                //if balance magnitude is negative - nerf player (lower their defense, raise opponents offense).
                //if balance magnitude is positive - buff player (raise their defense, lower opponents offense).

                //balance magnitude is representing damage per action needed to change from current line of best fit prediction
                //since we are applying two balancing actions (one per player), we can safely divide magnitude in half
                //need to convert DPA to relevant stat changes for damage balancing

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

                return directorActions;

            } else if (this.difficultyMode === 'environment') {
                // ***** SCALAR APPROACH *****

                //Use totalHP instead of individual HP
                let lineOfBestFitData = [];
                let currentAvgSum = 0;

                let tempData = this.gameState.actionCurrHPData.slice(-6);
                for (let point of tempData) {
                    currentAvgSum += point[3];
                    lineOfBestFitData.push([point[0], point[3]]);
                }

                currentAvgSum = currentAvgSum / lineOfBestFitData.length;

                //Fit Line
                let lineOfBestFit = ss.linearRegression(lineOfBestFitData);
                let lineOfBestFitSlope = lineOfBestFit.m;
                let lineOfBestFitYIntercept = lineOfBestFit.b;

                //Target Line
                let targetX1 = 0;
                let targetY1 = this.gameState.currentHP;
                let targetX2 = this.targetActions - this.gameState.totalPlayerActions;
                let targetY2 = 0;

                let targetSlope = Utils.safeDivide((targetY2 - targetY1), (targetX2 - targetX1));
                let targetYIntercept = targetY1;
                let lineOfBestFitY = (lineOfBestFitSlope * this.gameState.totalPlayerActions) + lineOfBestFitYIntercept;

                //Get next point on line for LoB, Target
                let lineOfBestFitNextX = this.gameState.totalPlayerActions + 1;
                let lineOfBestFitNextY = (lineOfBestFitSlope * lineOfBestFitNextX) + lineOfBestFitYIntercept;

                let targetNextX = 1;
                let targetNextY = targetSlope + targetYIntercept;

                //predict where next Y needs to be based on both points
                let yChange = targetNextY - lineOfBestFitNextY;
                let desiredY = currentAvgSum + yChange;

                // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
                // console.log("desired Y: " + desiredY);
                // console.log("next fit Y: " + lineOfBestFitNextY);
                // console.log("current action: " + this.gameState.totalPlayerActions);
                // console.log("target action: " + this.targetActions);
                // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");

                //Get a ratio of the distance between the line of fit next y and desired y.
                //Flip ratio depending if we are negative or positive, indicating if we should be > or < 1 for scaling
                let desiredToLoBYDistance = lineOfBestFitNextY - desiredY;
                //Determine ratio numerator/denominator by exponent; 1 or -1
                let ratioExponent = Math.abs(desiredToLoBYDistance) / desiredToLoBYDistance;
                //Get ratio
                let yChangeRatio = Math.pow(lineOfBestFitNextY / desiredToLoBYDistance, ratioExponent);

                //We don't need to check for buff or nerf as they should already be scaled appropriately.
                //TODO: We're currently wrapping all scalar adjustments in this method, we'll probably eventually want to refactor.
                let directorAction = this.adjustScalars(yChangeRatio);
                return directorAction;

            } else {
                this.logger.logError("AIDirector - balanceGame: Invalid difficulty mode specified! " + this.difficultyMode);
                return [];
            }
        }

        if (this.mode == 'inclusion') {
            let losingPlayer = null;
            let winningPlayer = null;

            let hpTie = false;
            let luckTie = false;
            let speedTie = false;

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
            } else {
                hpTie = true;
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
            } else {
                speedTie = true;
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
            } else {
                luckTie = true;
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

            if (!hpTie) {
                let randomNumber = RNG.next();
                if(randomNumber < .5){
                    return this.balanceHP(winningPlayer, losingPlayer);
                } else {
                    return this.balanceCurrHP(winningPlayer, losingPlayer);
                }
            } else {
                this.logger.logError("AIDirector - balanceGame: No HP impalance! No action taken.");
                return;
            }


            //TODO: Tune for targeting other stats.
            let randomNumber = RNG.next();
            let cumulativeValue = 0;

            cumulativeValue += balanceActions['hp'];
            if (randomNumber < cumulativeValue) {
                return this.balanceHP(winningPlayer, losingPlayer);
            }

            cumulativeValue += balanceActions['luck'];
            if (randomNumber < cumulativeValue) {
                return this.balanceLuck(luckyPlayer, unluckyPlayer);
            }

            cumulativeValue += balanceActions['speed'];
            if (randomNumber < cumulativeValue) {
                return this.balanceSpeed(fastPlayer, slowPlayer);
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

    adjustScalars(ratio) {

        let playerNum = [1, 2];
        let stats = ['DamageScalar', 'HealScalar'];
        let type = "environment";
        if (ratio > 1) {
            type = "environment buff";
        } else if (ratio < 1) {
            type = "environment nerf";
        } else if (ratio === 1) {
            type = "environment constant"
        } else if (ratio < 0) {
            this.logger.logError("AI Director - AdjustScalars: Environment change ratio somehow negative! " + ratio);
        } else {
            this.logger.logError("AI Director - AdjustScalars: Environment change ratio invalid! " + ratio);
        }
        let characterTargets = [];
        let statChange = ratio;

        return new DirectorAction(type, playerNum, characterTargets, stats, statChange);
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
        let stats = ['Defense', 'MagicDefense'];
        let type = "";
        if (statChange >= 0) {
            type = "buff";
        } else {
            type = "nerf";
        }

        return new DirectorAction(type, playerNum, playerLivingCharacters, stats, statChange);
    }


    balanceCurrHP(winningPlayer, losingPlayer) {
        //check for living characters
        const aliveWinningCharacters = winningPlayer.characters.filter(char => char.isAlive());
        const aliveLosingCharacters = losingPlayer.characters.filter(char => char.isAlive());

        if (aliveLosingCharacters.length === 0 || aliveWinningCharacters.length === 0) {
            console.log("AI Director: One team is defeated, no need to balance.");
            return;
        }

        const winningPlayerNum = aliveWinningCharacters[0].playerNumber;
        const losingPlayerNum = aliveLosingCharacters[0].playerNumber;

        //get raw amount to to deal/heal
        const rawStatChangeAmount = this.getRandomBuffAmount();
        //Scale down so balancing isn't insta-killing a player
        const statChange = rawStatChangeAmount * this.hpDamageAdjustmentScalar;

        let stats = ['currentHP'];
        let type = "";

        let healAction = new DirectorAction('heal', losingPlayerNum, aliveLosingCharacters, stats, statChange);
        let damageAction = new DirectorAction('damage', winningPlayerNum, aliveWinningCharacters, stats, statChange);

        const randomNumber = RNG.next();

        //randomly choose to heal loser, damage winner, or both
        if (randomNumber <= .33) { //heal
            return [healAction];
        } else if (randomNumber <= .66) { //damage
            return [damageAction];
        } else { //both
            return [healAction, damageAction];
        }



    }

    balanceHP(winningPlayer, losingPlayer) {
        //check for lviing characters
        const aliveWinningCharacters = winningPlayer.characters.filter(char => char.isAlive());
        const aliveLosingCharacters = losingPlayer.characters.filter(char => char.isAlive());

        if (aliveLosingCharacters.length === 0 || aliveWinningCharacters.length === 0) {
            console.log("AI Director: One team is defeated, no need to balance.");
            return;
        }

        const winningPlayerNum = aliveWinningCharacters[0].playerNumber;
        const losingPlayerNum = aliveLosingCharacters[0].playerNumber;

        //specify stats to buff and values of buff
        const stats = ['Attack', 'MagicAttack', 'MagicDefense', 'Defense'];
        const buffAmount = this.getRandomBuffAmount();
        const nerfAmount = this.getRandomNerfAmount();

        let buffAction = new DirectorAction('buff', losingPlayerNum, aliveLosingCharacters, stats, buffAmount);
        let nerfAction = new DirectorAction('nerf', winningPlayerNum, aliveWinningCharacters, stats, nerfAmount);


        const randomNumber = RNG.next();

        //randomly choose to buff, nerf, or both
        if (randomNumber <= .33) { //buff
            return [buffAction];
        } else if (randomNumber <= .66) { //nerf
            return [nerfAction];
        } else { //both
            return [buffAction, nerfAction];
        }
    }

    balanceSpeed(fastPlayer, slowPlayer) {
        //check for lviing characters
        const aliveFastCharacters = fastPlayer.characters.filter(char => char.isAlive());
        const aliveSlowCharacters = slowPlayer.characters.filter(char => char.isAlive());

        if (aliveFastCharacters.length === 0 || aliveSlowCharacters.length === 0) {
            console.log("AI Director: One team is defeated, no need to balance.");
            return;
        }

        const fastPlayerNum = aliveFastCharacters[0].playerNumber;
        const slowPlayerNum = aliveSlowCharacters[0].playerNumber;

        //specify stats to buff and values of buff
        const stats = ['Speed'];
        const buffAmount = this.getRandomBuffAmount();
        const nerfAmount = this.getRandomNerfAmount();

        let buffAction = new DirectorAction('buff', slowPlayerNum, aliveSlowCharacters, stats, buffAmount);
        let nerfAction = new DirectorAction('nerf', fastPlayerNum, aliveFastCharacters, stats, nerfAmount);

        console.log("SPEED BALANCE STATCHANGE: " + buffAmount + ", " + nerfAmount);

        const randomNumber = RNG.next();

        //randomly choose to buff, nerf, or both
        if (randomNumber <= .33) { //buff
            return [buffAction];
        } else if (randomNumber <= .66) { //nerf
            return [nerfAction];
        } else { //both
            return [buffAction, nerfAction];
        }
    }

    balanceLuck(luckyPlayer, unluckyPlayer) {
        //check for lviing characters
        const aliveLuckyCharacters = luckyPlayer.characters.filter(char => char.isAlive());
        const aliveUnluckyCharacters = unluckyPlayer.characters.filter(char => char.isAlive());

        if (aliveLuckyCharacters.length === 0 || aliveUnluckyCharacters.length === 0) {
            console.log("AI Director: One team is defeated, no need to balance.");
            return;
        }

        const luckyPlayerNum = aliveLuckyCharacters[0].playerNumber;
        const unluckyPlayerNum = aliveUnluckyCharacters[0].playerNumber;

        //specify stats to buff and values of buff
        const stats = ['Luck'];
        const buffAmount = this.getRandomBuffAmount();
        const nerfAmount = this.getRandomNerfAmount();

        let buffAction = new DirectorAction('buff', unluckyPlayerNum, aliveUnluckyCharacters, stats, buffAmount);
        let nerfAction = new DirectorAction('nerf', luckyPlayerNum, aliveLuckyCharacters, stats, nerfAmount);

        console.log("LUCK BALANCE STATCHANGE: " + buffAmount + ", " + nerfAmount);

        const randomNumber = RNG.next();

        //randomly choose to buff, nerf, or both
        if (randomNumber <= .33) { //buff
            return [buffAction];
        } else if (randomNumber <= .66) { //nerf
            return [nerfAction];
        } else { //both
            return [buffAction, nerfAction];
        }

    }

}

module.exports = AIDirector;