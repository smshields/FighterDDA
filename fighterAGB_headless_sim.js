const fs = require('fs');
const path = require('path');
const ss = require('simple-statistics');

// --- Constants ---
const MULTI_TARGET_SCALAR = 0.1;
const SINGLE_TARGET_SCALAR = 0.4;
const HEAL_SCALAR = 0.2;
const MULTI_HEAL_SCALAR = 0.05;
const SPEED_SCALAR = 0.1;

// Random Number Generator with a seed (for reproducibility)
class RNG {
    constructor(seed) {
        this.seed = seed;
        this.state = seed;
    }

    next() {
        // Simple linear congruential generator (LCG) for randomness
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        this.state = (a * this.state + c) % m;
        return this.state / m;
    }
}

class Character {
    constructor(playerNumber, name, baseStats, actions) {
        this.playerNumber = playerNumber; // Track which player this character belongs to
        this.name = name;

        // Apply fuzziness to stats
        const stats = {};
        for (const stat in baseStats) {
            let value = baseStats[stat];
            let fuzziness = Math.floor(Math.random() * 21) - 10; // Random number between -10 and +10
            value += fuzziness;
            value = Math.max(10, Math.min(100, value)); // Clamp between 10 and 100
            stats[stat] = value;
        }
        this.stats = {...stats,
            currentHP: stats.HP
        };
        this.actions = actions;
        this.actionBar = 0;
        this.defenseBoosted = false; // Flag for defense boost
        this.baseStats = {...stats
        }; // Store the base stats with fuzziness applied

    }

    isAlive() {
        return this.stats.currentHP > 0;
    }

    addActionPoints() {
        this.actionBar += this.stats.Speed * SPEED_SCALAR;
    }

    resetActionBar() {
        this.actionBar = 0;
    }

    resetDefense() {
        if (this.defenseBoosted) {
            this.stats.Defense = this.baseStats.Defense;
            this.stats.MagicDefense = this.baseStats.MagicDefense;
            this.defenseBoosted = false;
        }
    }

    applyDefenseBoost() {
        this.stats.Defense *= 1.25;
        this.stats.MagicDefense *= 1.25;
        this.defenseBoosted = true;
    }

    takeDamage(damage) {
        this.stats.currentHP = Math.max(0, this.stats.currentHP - damage);
    }

    heal(amount) {
        this.stats.currentHP = Math.min(this.stats.HP, this.stats.currentHP + amount);
    }
}

class AIPlayer {
    constructor(playerNumber, characters, mode = 'optimal', lowHealthThreshold = 0.3) {
        this.playerNumber = playerNumber;
        this.characters = characters;
        this.lowHealthThreshold = lowHealthThreshold; // 30% HP or less is considered low health
        this.mode = mode; // 'optimal', 'suboptimal', or 'random'
    }

    chooseAction(character, opponents) {
        switch (this.mode) {
            case 'optimal':
                return this.chooseOptimalAction(character, opponents);
            case 'suboptimal':
                return this.chooseSuboptimalAction(character, opponents);
            case 'random':
                return this.chooseRandomAction(character);
            default:
                console.warn(`Invalid AI mode: ${this.mode}. Defaulting to random.`);
                return this.chooseRandomAction(character);
        }
    }

    chooseOptimalAction(character, opponents) {
        const actionValues = {};

        for (const action of character.actions) {
            actionValues[action.type] = this.evaluateAction(character, action, opponents, this.characters, character);
        }

        let totalValue = 0;
        for (const action of character.actions) {
            totalValue += actionValues[action.type];
        }

        let randomNumber = Math.random() * totalValue;
        let cumulativeValue = 0;

        for (const action of character.actions) {
            cumulativeValue += actionValues[action.type];
            if (randomNumber <= cumulativeValue) {
                return action;
            }
        }

        const randomIndex = Math.floor(Math.random() * character.actions.length);
        let bestAction = character.actions[randomIndex];
        return bestAction;
    }

    chooseSuboptimalAction(character, opponents) {
        const actionValues = {};
        let totalValue = 0;

        for (const action of character.actions) {
            actionValues[action.type] = this.evaluateAction(character, action, opponents, this.characters, character);
        }

        // Invert the action values to prioritize suboptimal actions. Every value is guaranteed to be between 0-1
        const invertedActionValues = {};
        let totalInvertedValue = 0;
        for (const action of character.actions) {
            invertedActionValues[action.type] = 1 - actionValues[action.type]; // Invert values
            totalInvertedValue += invertedActionValues[action.type];
        }

        let randomNumber = Math.random() * totalInvertedValue;
        let cumulativeValue = 0;

        for (const action of character.actions) {
            cumulativeValue += invertedActionValues[action.type];
            if (randomNumber <= cumulativeValue) {
                return action;
            }
        }

        // Should not reach here, but return a random action as a fallback
        const randomIndex = Math.floor(Math.random() * character.actions.length);
        return character.actions[randomIndex];
    }

    chooseRandomAction(character) {
        const randomIndex = Math.floor(Math.random() * character.actions.length);
        return character.actions[randomIndex];
    }

    evaluateAction(character, action, opponents, allies, actingCharacter) {
        let value = 0;
        let target = this.chooseTarget(action, actingCharacter, opponents, allies);

        let minClamp = 0;
        let maxClamp = 0;
        //    map(value, sourceMin, sourceMax, targetMin, targetMax) {
        switch (action.type) {
            case 'attack':
                //Value attacking weakest opponent
                if (target) {
                    value = (character.stats.Attack - target.stats.Defense);
                    minClamp = -90;
                    maxClamp = 90;
                    value = this.map(value, minClamp, maxClamp, 0, 1);
                }
                break;
            case 'multi_attack':
                //Value multiattack based on average defense
                const aliveOpponents = opponents.filter(c => c.isAlive());
                let averageDefense = aliveOpponents.length > 0 ? aliveOpponents.reduce((sum, char) => sum + char.stats.Defense, 0) / aliveOpponents.length : 0;
                value = (character.stats.Attack - averageDefense) * aliveOpponents.length;
                minClamp = -90 * aliveOpponents.length;
                maxClamp = 90 * aliveOpponents.length;
                value = this.map(value, minClamp, maxClamp, 0, 1);
                break;
            case 'magic_attack':
                //Value attacking weakest opponent
                if (target) {
                    value = (character.stats.MagicAttack - target.stats.MagicDefense);
                    minClamp = -90;
                    maxClamp = 90;
                    value = this.map(value, minClamp, maxClamp, 0, 1);
                }
                break;
            case 'multi_magic_attack':
                //Value multiattack based on average magic defense
                const aliveMagicOpponents = opponents.filter(c => c.isAlive());
                let averageMagicDefense = aliveMagicOpponents.length > 0 ? aliveMagicOpponents.reduce((sum, char) => sum + char.stats.MagicDefense, 0) / aliveMagicOpponents.length : 0;
                value = (character.stats.MagicAttack - averageMagicDefense) * aliveMagicOpponents.length;
                minClamp = -90 * aliveMagicOpponents.length;
                maxClamp = 90 * aliveMagicOpponents.length;
                value = this.map(value, minClamp, maxClamp, 0, 1);
                break;
            case 'heal':
                //Value healing weakest ally
                if (target) {
                    minClamp = 1;
                    maxClamp = target.stats.HP;
                    value = this.map(target.stats.currentHP, minClamp, maxClamp, 0, 1);
                    value = 1 - value;
                }
                break;
            case 'multi_heal':
                //Value based on low health across team
                const aliveAllies = allies.filter(c => c.isAlive());
                let totalMaxHealth = 0;
                for (const ally of aliveAllies) {
                    totalMaxHealth += ally.stats.HP;
                }
                minClamp = 1;
                maxClamp = totalMaxHealth;

                let totalCurrentHealth = aliveAllies.length > 0 ? aliveAllies.reduce((sum, char) => sum + (char.stats.currentHP), 0) : 0;

                value = this.map(totalCurrentHealth, minClamp, maxClamp, 0, 1);
                value = 1 - value;
                break;
            case 'defend':
                // Value defend based on missing health, but keep it in a reasonable range
                const healthRatio = 1 - (character.stats.currentHP / character.stats.HP);
                value = (healthRatio ** 2) / 1.25;
                break;
        }
        return value;
    }

    findWeakestTarget(targets, stat) {
        let weakest = null;
        let lowestStat = Infinity;

        for (const target of targets) {
            if (target.isAlive() && target.stats[stat] < lowestStat) {
                weakest = target;
                lowestStat = target.stats[stat];
            }
        }
        return weakest;
    }

    chooseTarget(action, character, opponents, allies) {
        switch (action.type) {
            case 'attack':
                return this.findWeakestTarget(opponents, 'Defense');
            case 'magic_attack':
                return this.findWeakestTarget(opponents, 'MagicDefense');
            case 'heal':
                return this.findWeakestTarget(allies, 'currentHP'); //Heal weakest ally or self
            default:
                return null; // No target needed for other actions
        }
    }

    map(value, sourceMin, sourceMax, targetMin, targetMax) {
        return (value - sourceMin) * (targetMax - targetMin) / (sourceMax - sourceMin) + targetMin;
    }
}

class AI_Director {
    constructor(mode = 'inclusion', targetActions = 60, difficultyAdjustmentScalar = .001, actionThreshold = 0, thresholdAdjustment = 20) {
        this.maxBuffAmount = 60;
        this.maxNerfAmount = 60;
        this.gameState = {};
        this.mode = mode;

        this.balanceMagnitude = 0;


        //this.targetHPChangePerAction = 0;
        //this.prevHPChangePerAction = 0;
        this.targetActions = targetActions;
        //this.actionThreshold = actionThreshold;
        //this.actionChangeDifference = 0;
        this.difficultyAdjustmentScalar = difficultyAdjustmentScalar;
        //this.thresholdAdjustment = thresholdAdjustment;
        //this.prevChangeDifference = 0;
        //this.actionChangeDifference = 0;
    }

    getRandomBuffAmount() {
        return Math.floor(Math.random() * this.maxBuffAmount);
    }

    getRandomNerfAmount() {
        return Math.floor(Math.random() * this.maxNerfAmount);
    }

    //TODO: refactor into utils class.
    safeDivide(numerator, denominator) {
        if (denominator === 0) {
            return 0;
        } else {
            return numerator / denominator;
        }
    }

    //TODO: Refactor into a utils class
    // Linear map function
    map(value, sourceMin, sourceMax, targetMin, targetMax) {
        return (value - sourceMin) * (targetMax - targetMin) / (sourceMax - sourceMin) + targetMin;
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
                const slope = this.safeDivide((this.targetActions - this.gameState.totalPlayerActions ), (0 - currentTotalHP));
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



            // let threshold = Math.abs(this.targetHPChangePerAction * this.actionThreshold);
            // let negativeThreshold = this.targetHPChangePerAction - threshold;
            // let positiveThreshold = this.targetHPChangePerAction + threshold;

            // //if the prevHPChangePerAction is within an acceptable threshold, don't balance
            // if (
            //     this.prevHPChangePerAction >= negativeThreshold &&
            //     this.prevHPChangePerAction <= positiveThreshold
            // ) {
            //     console.log("Previous rate of HP change is in acceptable range. No need to balance.");
            //     return;
            // }
            //this.prevChangeDifference = this.actionChangeDifference;

            //roll evenly between luck or atk/def to start
            let randomNumber = Math.random();
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

            let player1WinValue = this.map(player1LivingRatio + this.gameState.player1Data.hpRatio, 0, 2, 0, 1);
            let player2WinValue = this.map(player2LivingRatio + this.gameState.player2Data.hpRatio, 0, 2, 0, 1);

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

            let player1SpeedValue = this.safeDivide(this.gameState.player1Data.actions, this.gameState.totalPlayerActions);
            let player2SpeedValue = this.safeDivide(this.gameState.player2Data.actions, this.gameState.totalPlayerActions);

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

            let player1LuckValue = this.safeDivide(this.gameState.player1Data.damageOut, this.gameState.totalPlayerDamageOut);
            let player2LuckValue = this.safeDivide(this.gameState.player2Data.damageOut, this.gameState.totalPlayerDamageOut);

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
            balanceActions['hp'] = this.map(balanceActions['hp'], 0, valueSum, 0, 1);
            balanceActions['luck'] = this.map(balanceActions['luck'], 0, valueSum, 0, 1);
            balanceActions['speed'] = this.map(balanceActions['speed'], 0, valueSum, 0, 1);

            let randomNumber = Math.random();
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

        let randomNumber = Math.random();
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

        const randomNumber = Math.random();

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

        const randomNumber = Math.random();

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

            const randomNumber = Math.random();

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

class Game {
    constructor(players, aiDirector, seed, directorActionInterval = 9, actionExecutionInterval = 3) {
        this.players = players;
        this.aiDirector = aiDirector;
        this.actionQueue = [];
        this.timeStep = 0;
        this.rng = new RNG(seed); // Initialize the RNG with the seed
        this.log = []; // Initialize an empty log array to hold time step details
        this.directorActionInterval = directorActionInterval; // How often the director acts
        this.actionExecutionInterval = actionExecutionInterval; // How often actions are executed from the queue
        this.gameState = {

            prevTotalPlayerActions: 0,
            totalPlayerActions: 0,
            totalPlayerDamageOut: 0,
            actionCurrHPData: [],

            player1Data: {
                totalHP: 0,
                currentHP: 0,
                prevCurrentHP: 0, //used to calculate last turn's HP change
                hpRatio: 0,
                actions: 0,
                damageOut: 0,
                characterData: {
                    mage: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    warrior: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    priest: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    rogue: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    }
                }
            },
            player2Data: {
                totalHP: 0,
                currentHP: 0,
                prevCurrentHP: 0,
                hpRatio: 0,
                actions: 0,
                damageOut: 0,
                characterData: {
                    mage: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    warrior: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    priest: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    },
                    rogue: {
                        damageOut: 0,
                        actions: 0,
                        damageRatio: 0,
                        actionRatio: 0,
                        hpRatio: 0
                    }
                }
            }
        };
        if (this.aiDirector) {
            this.aiDirector.gameState = this.gameState;
        }
    }

    checkGameOver() {
        for (let player of this.players) {
            if (player.characters.every(c => !c.isAlive())) {
                return player.playerNumber; // Return the player number who lost
            }
        }
        return null; // No player has lost yet
    }


    enqueueAction(player, character) {
        if (!character.isAlive()) {
            return; // Skip enqueuing the action if the character is dead
        }

        const opponent = this.players.find(p => p !== player);
        const chosenAction = player.chooseAction(character, opponent.characters);
        if (!chosenAction) return;

        const targets = this.getTargets(character, chosenAction, opponent.characters, player.characters);
        this.actionQueue.push({
            character,
            chosenAction,
            targets,
            chosenAction
        });
    }

    //TODO: Refactor into a utils class
    // Linear map function
    map(value, sourceMin, sourceMax, targetMin, targetMax) {
        return (value - sourceMin) * (targetMax - targetMin) / (sourceMax - sourceMin) + targetMin;
    }

    processTurn() {
        this.timeStep++;

        // Remove dead characters from action queue - but only for character actions
        this.actionQueue = this.actionQueue.filter(action => {
            return action.character ? action.character.isAlive() : true; // Keep AI Director actions
        });

        // Initialize the actionsExecuted array
        let actionsExecutedThisTurn = [];

        // Capture the game state at this time step
        let stepLog = {
            timeStep: this.timeStep,
            actionsInQueue: this.actionQueue.map(action => {
                let actionDetails = {
                    player: action.character ? action.character.playerNumber : 'AI Director',
                    character: action.character ? action.character.name : 'AI Director',
                    actionType: action.chosenAction ? action.chosenAction.type : action.type,
                    targetDetails: action.targets ? action.targets.map(target => ({
                        playerNumber: target.playerNumber,
                        name: target.name
                    })) : [],
                };

                // Add AI Director specific details if it's an AI Director action
                if (action.type === 'buff' || action.type === 'nerf') {
                    actionDetails.targetPlayer = action.playerNum;
                    actionDetails.targetCharacter = action.targets;
                    actionDetails.statChanged = action.stats;
                    actionDetails.amountChanged = action.amount;
                }
                return actionDetails;
            }),
            actionsExecuted: actionsExecutedThisTurn,
            characters: this.players.flatMap(player => player.characters.map(character => ({
                player: character.playerNumber,
                name: character.name,
                currentHP: character.stats.currentHP,
                stats: {...character.stats
                }, // Capture all stats
                baseStats: {...character.baseStats
                }
            }))),
            queueLength: this.actionQueue.length,
            gameState: {}
        };

        this.players.forEach(player => {
            player.characters.forEach(character => {
                if (character.isAlive()) {
                    character.addActionPoints();
                    if (character.actionBar >= 100) {
                        this.enqueueAction(player, character);
                        character.resetActionBar();
                        character.resetDefense(); // Reset defense after the turn, but not AI buffs
                    }
                }
            });
        });

        // Balance the game every n=directorActionInterval steps
        if (this.timeStep % this.directorActionInterval === 0 && this.aiDirector) {
            let directorAction = this.aiDirector.balanceGame(this.players, this.log, this.timeStep, this.actionQueue);
            console.log("REACHED BALANCING OPERATION");
            if(directorAction){
                this.executeAIDirectorAction(directorAction, stepLog);
            }
        }

        //before executing actions, save previous turn's number of actions
        this.gameState.prevTotalPlayerActions = this.gameState.totalPlayerActions;

        // Execute Actions for turn
        if (this.timeStep % this.actionExecutionInterval === 0 && this.actionQueue.length > 0) {
            let action = this.actionQueue.shift();

            if (action.type === 'buff' || action.type === 'nerf' || action.type === 'heal' || action.type === 'damage') {
            //    this.executeAIDirectorAction(action, stepLog); // Handle AI Director actions
            } else {
                this.executeAction(action, stepLog); // Handle character actions
                const currentTotalHP = this.gameState.player1Data.currentHP + this.gameState.player2Data.currentHP;
                this.gameState.actionCurrHPData.push([this.gameState.totalPlayerActions, currentTotalHP]); //update based on array
            }
        }



        //update useful player data stats

        //Set HP Ratios
        //variables for player HP ratio
        let totalPlayer1HP = 0;
        let currentPlayer1HP = 0;
        let totalPlayer2HP = 0;
        let currentPlayer2HP = 0;

        //Update prevCurrentHP before updating currentHP
        this.gameState.player1Data.prevCurrentHP = this.gameState.player1Data.currentHP;
        this.gameState.player2Data.prevCurrentHP = this.gameState.player2Data.currentHP;

        //TODO: Fix this data access, logging implementation was bad...
        if (stepLog.characters) {
            for (let character of stepLog.characters) {
                if (character.player == 1) {
                    totalPlayer1HP += character.stats.HP;
                    currentPlayer1HP += character.currentHP;

                    switch (character.name) {
                        case 'warrior':
                            {
                                this.gameState.player1Data.characterData.warrior.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'mage':
                            {
                                this.gameState.player1Data.characterData.mage.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'priest':
                            {
                                this.gameState.player1Data.characterData.priest.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'rogue':
                            {
                                this.gameState.player1Data.characterData.rogue.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        default:
                            {
                                break
                            }
                    }

                } else {
                    totalPlayer2HP += character.stats.HP;
                    currentPlayer2HP += character.currentHP;
                    switch (character.name) {
                        case 'warrior':
                            {
                                this.gameState.player2Data.characterData.warrior.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'mage':
                            {
                                this.gameState.player2Data.characterData.mage.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'priest':
                            {
                                this.gameState.player2Data.characterData.priest.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        case 'rogue':
                            {
                                this.gameState.player2Data.characterData.rogue.hpRatio = character.currentHP / character.stats.HP;
                                break
                            }
                        default:
                            {
                                break
                            }
                    }

                }
                this.gameState.player1Data.totalHP = totalPlayer1HP;
                this.gameState.player1Data.currentHP = currentPlayer1HP;
                this.gameState.player2Data.totalHP = totalPlayer2HP;
                this.gameState.player2Data.currentHP = currentPlayer2HP;
            }
        }

        //Player1 Ratios
        this.gameState.player1Data.characterData.mage.damageRatio = this.safeDivide(this.gameState.player1Data.characterData.mage.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player1Data.characterData.mage.actionRatio = this.safeDivide(this.gameState.player1Data.characterData.mage.actions, this.gameState.totalPlayerActions);

        this.gameState.player1Data.characterData.warrior.damageRatio = this.safeDivide(this.gameState.player1Data.characterData.warrior.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player1Data.characterData.warrior.actionRatio = this.safeDivide(this.gameState.player1Data.characterData.warrior.actions, this.gameState.totalPlayerActions);

        this.gameState.player1Data.characterData.priest.damageRatio = this.safeDivide(this.gameState.player1Data.characterData.priest.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player1Data.characterData.priest.actionRatio = this.safeDivide(this.gameState.player1Data.characterData.priest.actions, this.gameState.totalPlayerActions);

        this.gameState.player1Data.characterData.rogue.damageRatio = this.safeDivide(this.gameState.player1Data.characterData.rogue.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player1Data.characterData.rogue.actionRatio = this.safeDivide(this.gameState.player1Data.characterData.rogue.actions, this.gameState.totalPlayerActions);

        //Player2 Ratios
        this.gameState.player2Data.characterData.mage.damageRatio = this.safeDivide(this.gameState.player2Data.characterData.mage.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player2Data.characterData.mage.actionRatio = this.safeDivide(this.gameState.player2Data.characterData.mage.actions, this.gameState.totalPlayerActions);

        this.gameState.player2Data.characterData.warrior.damageRatio = this.safeDivide(this.gameState.player2Data.characterData.warrior.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player2Data.characterData.warrior.actionRatio = this.safeDivide(this.gameState.player2Data.characterData.warrior.actions, this.gameState.totalPlayerActions);

        this.gameState.player2Data.characterData.priest.damageRatio = this.safeDivide(this.gameState.player2Data.characterData.priest.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player2Data.characterData.priest.actionRatio = this.safeDivide(this.gameState.player2Data.characterData.priest.actions, this.gameState.totalPlayerActions);

        this.gameState.player2Data.characterData.rogue.damageRatio = this.safeDivide(this.gameState.player2Data.characterData.rogue.damageOut, this.gameState.totalPlayerDamageOut);
        this.gameState.player2Data.characterData.rogue.actionRatio = this.safeDivide(this.gameState.player2Data.characterData.rogue.actions, this.gameState.totalPlayerActions);

        //Player HP Ratios
        this.gameState.player1Data.hpRatio = currentPlayer1HP / totalPlayer1HP;
        this.gameState.player2Data.hpRatio = currentPlayer2HP / totalPlayer2HP;



        //update gameState with new changes from turn simulation
        stepLog.gameState = structuredClone(this.gameState);

        // Push the time step log to the main log array
        this.log.push(stepLog);
    }

    //TODO: refactor into utils class.
    safeDivide(numerator, denominator) {
        if (denominator === 0) {
            return 0;
        } else {
            return numerator / denominator;
        }
    }

    executeAction({
            character,
            chosenAction,
            targets
        }, stepLog) {
            // Filter out dead targets
            const aliveTargets = targets.filter(target => target.isAlive());

            if (aliveTargets.length === 0 && chosenAction.type !== 'defend') {
                return; // If there are no alive targets, skip this action entirely
            }

            //update data for actions taken
            this.gameState.totalPlayerActions++;
            if (character.playerNumber === 1) {
                this.gameState.player1Data.actions++;
                switch (character.name) {
                    case 'warrior':
                        {
                            this.gameState.player1Data.characterData.warrior.actions++;
                            break
                        }
                    case 'mage':
                        {
                            this.gameState.player1Data.characterData.mage.actions++;
                            break
                        }
                    case 'priest':
                        {
                            this.gameState.player1Data.characterData.priest.actions++;
                            break
                        }
                    case 'rogue':
                        {
                            this.gameState.player1Data.characterData.rogue.actions++;
                            break
                        }
                    default:
                        {
                            break
                        }
                }
            } else {
                this.gameState.player2Data.actions++;
                switch (character.name) {
                    case 'warrior':
                        {
                            this.gameState.player2Data.characterData.warrior.actions++;
                            break
                        }
                    case 'mage':
                        {
                            this.gameState.player2Data.characterData.mage.actions++;
                            break
                        }
                    case 'priest':
                        {
                            this.gameState.player2Data.characterData.priest.actions++;
                            break
                        }
                    case 'rogue':
                        {
                            this.gameState.player2Data.characterData.rogue.actions++;
                            break
                        }
                    default:
                        {
                            break
                        }
                }
            }

            let actionDescription = `[Time Step: ${this.timeStep}] ${character.name} from player ${character.playerNumber} is using ${chosenAction.type}`;
            let targetString = aliveTargets.map(target => `${target.playerNumber} - ${target.name}`).join(", ");
            let damage = 0;
            let healAmount = 0;
            let attackingStat = 0;
            let defendingStat = 0;
            let minAttack = 0; // Initialize
            let minDefense = 0; // Initialize
            let avgDef = 0; // Initialize
            let minHeal = 0; // Initialize
            let avgMultiDef = 0; // Initialize
            let minMultiHeal = 0; // Initialize
            let rawDamage = 0; // Initialize
            let rawHeal = 0;
            let preScalarHeal = 0;
            const defeatedCharacters = []; // Keep track of defeated characters in this action

            //TODO: Convert to constants or parameters defined by character's highest HP value.
            let minHPChange = 1;
            let maxHPChange = 65;

            //TODO: Calculate constants for clamp values ahead of time instead of hardcoding below
            let minClamp = 0;
            let maxClamp = 0;

            switch (chosenAction.type) {
                case 'attack':
                    // 1. Determine minimum possible attack: stat - (stat * (1-luck/100))
                    minAttack = character.stats.Attack - (character.stats.Attack * (1 - character.stats.Luck / 100));
                    // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                    attackingStat = minAttack + this.getRandom() * (character.stats.Attack - minAttack);

                    // 1. Determine minimum possible defense: stat - (stat * (1-luck/100))
                    minDefense = targets[0].stats.Defense - (targets[0].stats.Defense * (1 - targets[0].stats.Luck / 100));
                    // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                    defendingStat = minDefense + this.getRandom() * (targets[0].stats.Defense - minDefense);

                    // Calculate raw damage, clamp, and map to the 1-65 range
                    rawDamage = (attackingStat - defendingStat);

                    //min val - -90, if atk = 10 and def = 100; max val - 90, if atk = 100 and def = 10
                    minClamp = -90;
                    maxClamp = 90;

                    rawDamage = Math.max(minClamp, Math.min(maxClamp, rawDamage)); // Clamp between -90 and 90

                    damage = (this.map(rawDamage, minClamp, maxClamp, minHPChange, maxHPChange)) * SINGLE_TARGET_SCALAR; // Map to 1-65

                    targets[0].takeDamage(Math.floor(damage));
                    actionDescription += ` dealing ${Math.floor(damage)} damage to ${targets[0].name} from player ${targets[0].playerNumber}`;

                    this.gameState.totalPlayerDamageOut += damage;
                    if (character.playerNumber === 1) {
                        this.gameState.player1Data.damageOut += damage;
                        switch (character.name) {
                            case 'warrior':
                                {
                                    this.gameState.player1Data.characterData.warrior.damageOut += damage;
                                    break
                                }
                            case 'mage':
                                {
                                    this.gameState.player1Data.characterData.mage.damageOut += damage;
                                    break
                                }
                            case 'priest':
                                {
                                    this.gameState.player1Data.characterData.priest.damageOut += damage;
                                    break
                                }
                            case 'rogue':
                                {
                                    this.gameState.player1Data.characterData.rogue.damageOut += damage;
                                    break
                                }
                            default:
                                {
                                    break
                                }
                        }
                    } else {
                        this.gameState.player2Data.damageOut += damage;
                        switch (character.name) {
                            case 'warrior':
                                {
                                    this.gameState.player2Data.characterData.warrior.damageOut += damage;
                                    break
                                }
                            case 'mage':
                                {
                                    this.gameState.player2Data.characterData.mage.damageOut += damage;
                                    break
                                }
                            case 'priest':
                                {
                                    this.gameState.player2Data.characterData.priest.damageOut += damage;
                                    break
                                }
                            case 'rogue':
                                {
                                    this.gameState.player2Data.characterData.rogue.damageOut += damage;
                                    break
                                }
                            default:
                                {
                                    break
                                }
                        }
                    }

                    break;
                case 'multi_attack':
                    {
                        const damagedTargetNames = aliveTargets.map(target => `${target.name} from player ${target.playerNumber}`);
                        let damageDetails = []; // Array to hold damage details for each target
                        let totalDamage = 0; // Initialize to zero

                        for (const target of aliveTargets) {
                            // 1. Determine minimum possible attack: stat - (stat * (1-luck/100))
                            let minAttack = character.stats.Attack - (character.stats.Attack * (1 - character.stats.Luck / 100));
                            // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                            let attackingStat = minAttack + this.getRandom() * (character.stats.Attack - minAttack);

                            // 1. Determine minimum possible defense: stat - (stat * (1-luck/100))
                            let minDefense = target.stats.Defense - (target.stats.Defense * (1 - target.stats.Luck / 100));
                            // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                            let defendingStat = minDefense + this.getRandom() * (target.stats.Defense - minDefense);

                            // Calculate raw damage, clamp, and map to the 1-65 range
                            let rawDamage = (attackingStat - defendingStat);
                            //min val - -90, if atk = 10 and def = 100; max val - 90, if atk = 100 and def = 10
                            minClamp = -90;
                            maxClamp = 90;
                            rawDamage = Math.max(minClamp, Math.min(maxClamp, rawDamage)); // Clamp between -90 and 90

                            let damage = (this.map(rawDamage, minClamp, maxClamp, 1, 65)); // Map to 1-65

                            let dmg = Math.floor(damage) * MULTI_TARGET_SCALAR;

                            target.takeDamage(dmg);

                            damageDetails.push({
                                target: target.name,
                                damage: dmg
                            });
                            totalDamage += dmg;
                        }

                        this.gameState.totalPlayerDamageOut += totalDamage;
                        if (character.playerNumber === 1) {
                            this.gameState.player1Data.damageOut += totalDamage;
                            switch (character.name) {
                                case 'warrior':
                                    {
                                        this.gameState.player1Data.characterData.warrior.damageOut += totalDamage;
                                        break
                                    }
                                case 'mage':
                                    {
                                        this.gameState.player1Data.characterData.mage.damageOut += totalDamage;
                                        break
                                    }
                                case 'priest':
                                    {
                                        this.gameState.player1Data.characterData.priest.damageOut += totalDamage;
                                        break
                                    }
                                case 'rogue':
                                    {
                                        this.gameState.player1Data.characterData.rogue.damageOut += totalDamage;
                                        break
                                    }
                                default:
                                    {
                                        break
                                    }
                            }
                        } else {
                            this.gameState.player2Data.damageOut += totalDamage;
                            switch (character.name) {
                                case 'warrior':
                                    {
                                        this.gameState.player2Data.characterData.warrior.damageOut += totalDamage;
                                        break
                                    }
                                case 'mage':
                                    {
                                        this.gameState.player2Data.characterData.mage.damageOut += totalDamage;
                                        break
                                    }
                                case 'priest':
                                    {
                                        this.gameState.player2Data.characterData.priest.damageOut += totalDamage;
                                        break
                                    }
                                case 'rogue':
                                    {
                                        this.gameState.player2Data.characterData.rogue.damageOut += totalDamage;
                                        break
                                    }
                                default:
                                    {
                                        break
                                    }
                            }
                        }

                        actionDescription = `[Time Step: ${this.timeStep}] ${character.name} from player ${character.playerNumber} is using multi_attack, dealing damage to ${aliveTargets.map(target => `${target.name} (${damageDetails.find(d => d.target === target.name).damage})`).join(', ')}`;
                    break;
                }
            case 'magic_attack':
                // 1. Determine minimum possible attack: stat - (stat * (1-luck/100))
                minAttack = character.stats.MagicAttack - (character.stats.MagicAttack * (1 - character.stats.Luck / 100));
                // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                attackingStat = minAttack + this.getRandom() * (character.stats.MagicAttack - minAttack);

                // 1. Determine minimum possible defense: stat - (stat * (1-luck/100))
                minDefense = targets[0].stats.MagicDefense - (targets[0].stats.MagicDefense * (1 - targets[0].stats.Luck / 100));
                // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                defendingStat = minDefense + this.getRandom() * (targets[0].stats.MagicDefense - minDefense);

                // Calculate raw damage, clamp, and map to the 1-65 range
                rawDamage = (attackingStat - defendingStat);

                minClamp = -90;
                maxClamp = 90;

                rawDamage = Math.max(minClamp, Math.min(maxClamp, rawDamage)); // Clamp between -90 and 90

                damage = (this.map(rawDamage, minClamp, maxClamp, minHPChange, maxHPChange)) * SINGLE_TARGET_SCALAR; // Map to 1-65

                targets[0].takeDamage(Math.floor(damage));
                actionDescription += ` dealing ${Math.floor(damage)} damage to ${targets[0].name} from player ${targets[0].playerNumber}`;

                this.gameState.totalPlayerDamageOut += damage;
                if (character.playerNumber === 1) {
                    this.gameState.player1Data.damageOut += damage;
                    switch (character.name) {
                        case 'warrior': {
                            this.gameState.player1Data.characterData.warrior.damageOut += damage;
                            break
                        }
                        case  'mage': {
                            this.gameState.player1Data.characterData.mage.damageOut += damage;
                            break
                        }
                        case  'priest': {
                            this.gameState.player1Data.characterData.priest.damageOut += damage;
                            break
                        }
                        case  'rogue': {
                            this.gameState.player1Data.characterData.rogue.damageOut += damage;
                            break
                        }
                        default: {
                            break
                        }
                    }
                } else {
                    this.gameState.player2Data.damageOut += damage;
                    switch (character.name) {
                        case 'warrior': {
                            this.gameState.player2Data.characterData.warrior.damageOut += damage;
                            break
                        }
                        case  'mage': {
                            this.gameState.player2Data.characterData.mage.damageOut += damage;
                            break
                        }
                        case  'priest': {
                            this.gameState.player2Data.characterData.priest.damageOut += damage;
                            break
                        }
                        case  'rogue': {
                            this.gameState.player2Data.characterData.rogue.damageOut += damage;
                            break
                        }
                        default: {
                            break
                        }
                    }
                }
                break;
            case 'multi_magic_attack':
                {
                    const damagedTargetNames = aliveTargets.map(target => `${target.name} from player ${target.playerNumber}`);
                    let damageDetails = []; // Array to hold damage details for each target
                    let totalDamage = 0; // Initialize to zero

                    for (const target of aliveTargets) {
                        // 1. Determine minimum possible attack: stat - (stat * (1-luck/100))
                        let minAttack = character.stats.MagicAttack - (character.stats.MagicAttack * (1 - character.stats.Luck / 100));
                        // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                        let attackingStat = minAttack + this.getRandom() * (character.stats.MagicAttack - minAttack);

                        // 1. Determine minimum possible defense: stat - (stat * (1-luck/100))
                        let minDefense = target.stats.MagicDefense - (target.stats.MagicDefense * (1 - target.stats.Luck / 100));
                        // 2. randomly pick (based off of game seed) a value between minimum possible damage and base stat
                        let defendingStat = minDefense + this.getRandom() * (target.stats.MagicDefense - minDefense);

                        // Calculate raw damage, clamp, and map to the 1-65 range
                        let rawDamage = (attackingStat - defendingStat);
                        //min val - -90, if atk = 10 and def = 100; max val - 90, if atk = 100 and def = 10
                        minClamp = -90;
                        maxClamp = 90;

                        rawDamage = Math.max(minClamp, Math.min(maxClamp, rawDamage)); // Clamp between -90 and 90

                        let damage = (this.map(rawDamage, minClamp, maxClamp, 1, 65)); // Map to 1-65
                        let dmg = Math.floor(damage) * MULTI_TARGET_SCALAR;
                        target.takeDamage(dmg);

                        damageDetails.push({
                            target: target.name,
                            damage: dmg
                        });
                        totalDamage += dmg;
                    }

                    this.gameState.totalPlayerDamageOut += totalDamage;
                    if (character.playerNumber === 1) {
                        this.gameState.player1Data.damageOut += totalDamage;
                        switch (character.name) {
                            case 'warrior': {
                                this.gameState.player1Data.characterData.warrior.damageOut += totalDamage;
                                break
                            }
                            case  'mage': {
                                this.gameState.player1Data.characterData.mage.damageOut += totalDamage;
                                break
                            }
                            case  'priest': {
                                this.gameState.player1Data.characterData.priest.damageOut += totalDamage;
                                break
                            }
                            case  'rogue': {
                                this.gameState.player1Data.characterData.rogue.damageOut += totalDamage;
                                break
                            }
                            default: {
                                break
                            }
                        }
                    } else {
                        this.gameState.player2Data.damageOut += totalDamage;
                        switch (character.name) {
                            case 'warrior': {
                                this.gameState.player2Data.characterData.warrior.damageOut += totalDamage;
                                break
                            }
                            case  'mage': {
                                this.gameState.player2Data.characterData.mage.damageOut += totalDamage;
                                break
                            }
                            case  'priest': {
                                this.gameState.player2Data.characterData.priest.damageOut += totalDamage;
                                break
                            }
                            case  'rogue': {
                                this.gameState.player2Data.characterData.rogue.damageOut += totalDamage;
                                break
                            }
                            default: {
                                break
                            }
                        }
                    }

                    actionDescription = `[Time Step: ${this.timeStep}] ${character.name} from player ${character.playerNumber} is using multi_magic_attack, dealing damage to ${aliveTargets.map(target => `${target.name} (${damageDetails.find(d => d.target === target.name).damage})`).join(', ')}`;
                break;
            }
            case 'heal':
                // 1. Determine average defense
                avgDef = (character.stats.MagicDefense + character.stats.Defense) / 2;
                // 2. Calculate minimum possible heal based on luck
                minHeal = avgDef * (character.stats.Luck / 100);
                // 3. randomly pick (based off of game seed) a value between minimum possible heal and average defense, tune against scalar
                rawHeal = (minHeal + this.getRandom() * (avgDef - minHeal)) * HEAL_SCALAR;
                // 4. clamp values

                minClamp = 10 * HEAL_SCALAR;
                maxClamp = 100 * HEAL_SCALAR;

                rawHeal = Math.max(minClamp, Math.min(maxClamp, rawHeal)); // clamp between 0 and 80
                // 5. map values
                healAmount = this.map(rawHeal, minClamp, maxClamp, minHPChange, maxHPChange);
                healAmount = Math.floor(healAmount);
                targets[0].heal(healAmount);
                actionDescription += ` healing ${targets[0].name} from player ${targets[0].playerNumber} for ${healAmount} health`;
                break;
            case 'multi_heal':
                {
                    // 1. Determine average defense
                    avgDef = (character.stats.MagicDefense + character.stats.Defense) / 2;
                    // 2. Calculate minimum possible heal based on luck
                    minHeal = avgDef * (character.stats.Luck / 100);
                    // 3. randomly pick (based off of game seed) a value between minimum possible heal and average defense
                    rawHeal = (minHeal + this.getRandom() * (avgDef - minHeal)) * MULTI_HEAL_SCALAR;

                    minClamp = 10 * MULTI_HEAL_SCALAR;
                    maxClamp = 100 * MULTI_HEAL_SCALAR;

                    // 4. clamp values
                    rawHeal = Math.max(minClamp, Math.min(maxClamp, rawHeal)); // clamp between 0 and 80
                    // 5. map values
                    healAmount = this.map(rawHeal, minClamp, maxClamp, minHPChange, maxHPChange);
                    healAmount = Math.floor(healAmount);

                    const healedTargetNames = aliveTargets.map(target => `${target.name} from player ${target.playerNumber}`);
                    actionDescription = `[Time Step: ${this.timeStep}] ${character.name} from player ${character.playerNumber} is using multi_heal, multi-healing  ${healedTargetNames.join(', ')} for ${healAmount} health each`;
                    aliveTargets.forEach(target => target.heal(healAmount));
                    break;
                }
            case 'defend':
                character.applyDefenseBoost();
                actionDescription += ` defending`;
                break;
        }

        console.log(actionDescription);

        // Log the executed action for this step
        const actionDetails = {
            player: character.playerNumber,
            character: character.name,
            actionType: chosenAction.type,
            targets: aliveTargets.map(target => `${target.playerNumber} - ${target.name}`),
            damageDealt: damage,
            healAmount: healAmount
        };
        stepLog.actionsExecuted.push(actionDetails);

        aliveTargets.forEach(target => {
            if (!target.isAlive()) {
                defeatedCharacters.push(target);
            }
        });

        defeatedCharacters.forEach(target => {
            console.log(`${target.name} from player ${target.playerNumber} has been defeated!`);
        });
        stepLog.actionsExecuted.push(actionDetails);
    }

    getTargets(character, chosenAction, opponents, allies) {
        let target = null;
        if (chosenAction.type === 'heal') {
            // Heal should target only one ally, including the character itself
            let validHealTargets = allies.filter(c => c.isAlive());

            //The chooseTarget function from the player AI is used to determine the best target
            target = character.player.chooseTarget(chosenAction, character, [], validHealTargets);

            if (target) {
                return [target];
            } else {
                return [];
            }
        } else if (chosenAction.type === 'multi_heal') {
            // Multi-heal should target all allies, including the character itself
            return allies.filter(c => c.isAlive());
        } else {
            // Other actions (attack, magic) target opponents
            if (chosenAction.multiTarget) {
                return opponents.filter(c => c.isAlive());
            } else {
                let aliveOpponents = opponents.filter(c => c.isAlive()); // ADDED THIS LINE
                target = character.player.chooseTarget(chosenAction, character, aliveOpponents, allies); // EDITED THIS LINE
                if (target) {
                    return [target];
                } else {
                    return [];
                }
            }
        }
    }

    executeAIDirectorAction(action, stepLog) {
        let {
            type,
            targets,
            stats,
            amount,
            playerNum
        } = action;
        let actionDescription = `[Time Step: ${this.timeStep}] AI Director is using ${type} on ${targets} from player ${playerNum}`;

        if (type === 'buff') {
            for (let target of targets) {
                for (let stat of stats) {
                    target.baseStats[stat] += amount;
                    target.stats[stat] += amount;
                    target.stats[stat] = Math.min(100, Math.max(10, target.stats[stat])); // Cap Stats
                    actionDescription += ` buffing ${stat} by ${amount}. New value: ${target.stats[stat]}`;
                }
            }
        } else if (type === 'nerf') {
            for (let target of targets) {
                for (let stat of stats) {
                    target.baseStats[stat] -= amount;
                    target.stats[stat] -= amount;
                    target.stats[stat] = Math.max(10, Math.min(100, target.stats[stat])); // Floor stats
                    actionDescription += ` nerfing ${stat} by ${amount}. New value: ${target.stats[stat]}`;
                }
            }
        } else if (type === 'heal') {
            for (let target of targets) {
                target.stats['currentHP'] += amount;
                target.stats['currentHP'] = Math.min(target.baseStats['HP'], target.stats['currentHP']);
                actionDescription += ` healing 'currentHP' by ${amount}. New value: ${target.stats['currentHP']}`;
            }
        } else if (type === 'damage') {
            for (let target of targets) {
                target.stats['currentHP'] -= amount;
                target.stats['currentHP'] = Math.max(0, target.stats['currentHP']);
                actionDescription += ` damaging 'currentHP' by ${amount}. New value: ${target.stats['currentHP']}`;
            }
        }
        console.log(actionDescription);

        // Log the executed action for this step
        const actionDetails = {
            player: 'AI Director',
            character: targets,
            actionType: type,
            playerNum: playerNum,
            statChanged: stats,
            amountChanged: amount
        };
        stepLog.actionsExecuted.push(actionDetails);
    }

    runSimulation(maxSteps = Infinity) {
        let winner = null;
        while (!winner && this.timeStep < maxSteps) {
            this.processTurn();
            winner = this.checkGameOver();
        }
        console.log("Game Over");
        if (winner) {
            console.log(`Player ${winner} lost!`);
        } else {
            console.log("Game ended due to max steps.");
        }
        console.log(this.gameState.totalPlayerActions);
        this.outputLog(); // Output the log at the end of the simulation
    }

    getRandom() {
        return this.rng.next(); // Use the seeded RNG for any random value
    }

    outputLog() {
        console.log("PAUSING LOGS... TODO");
        // const jsonLog = JSON.stringify(this.log, null, 2);
        // const fileName = `simulation_log_${Date.now()}.json`;
        // const filePath = path.join(this.logDirectory, fileName); // Use the log directory

        // console.log(`Saving log to: ${filePath}`);

        // // Save the log to a file using fs.writeFileSync(fileName, jsonLog);
        // fs.writeFileSync(filePath, jsonLog);
    }
}

// New function to run repeated simulations
const runRepeatedSimulations = (numSimulations = 1, aiDirector = new AI_Director(), seed = 1234, directorActionInterval = 20, actionExecutionInterval = 3) => {
    let player1Wins = 0;
    let player2Wins = 0;
    let totalTimeSteps = 0;
    let totalActions = 0;

    // Create the main directory with timestamp
    const mainDirectory = `simulation_run_${Date.now()}`;
    fs.mkdirSync(mainDirectory);

    for (let i = 0; i < numSimulations; i++) {
        // Create subdirectory for each simulation
        const simulationDirectory = path.join(mainDirectory, `simulation_${i + 1}`);
        fs.mkdirSync(simulationDirectory);

        // Create players with AIPlayer methods
        const team1 = new AIPlayer(1, createTeam(1).characters, 'optimal', 0.3);
        const team2 = new AIPlayer(2, createTeam(2).characters, 'optimal', 0.3);

        team1.characters.forEach(character => character.player = team1);
        team2.characters.forEach(character => character.player = team2);

        const game = new Game([team1, team2], aiDirector, seed + i, directorActionInterval, actionExecutionInterval);
        game.logDirectory = simulationDirectory; // Set the log directory
        game.runSimulation();
        console.log("Simulation Number: " + (i+1))

        const winner = game.checkGameOver();
        totalTimeSteps += game.timeStep;
        totalActions += game.gameState.totalPlayerActions;
        if (winner === 1) {
            player2Wins++; //Player 2 causes player 1 to lose.
        } else if (winner === 2) {
            player1Wins++; //Player 1 causes player 2 to lose.
        }
    }

    const player1WinRate = (player1Wins / numSimulations) * 100;
    const player2WinRate = (player2Wins / numSimulations) * 100;
    const averageTimeSteps = totalTimeSteps/numSimulations;
    const averageActions = totalActions/numSimulations;

    console.log(`\n--- Simulation Results ---`);
    console.log(`Number of Simulations: ${numSimulations}`);
    console.log(`Player 1 Win Rate: ${player1WinRate.toFixed(2)}%`);
    console.log(`Player 2 Win Rate: ${player2WinRate.toFixed(2)}%`);
    console.log(`Average Simulation Length: ${averageTimeSteps.toFixed(2)}`);
    console.log(`Average Number of Actions: ${averageActions.toFixed(2)}`);
};

//STAT MIN/MAX
// WARRIOR_MIN_ATTACK
// WARRIOR_MAX_ATTACK
// WARRIOR_MIN_ATTACK
// WARRIOR_MAX_ATTACK
// WARRIOR_MIN_ATTACK
// WARRIOR_MAX_ATTACK
// WARRIOR_MIN_ATTACK
// WARRIOR_MAX_ATTACK
// WARRIOR_MIN_ATTACK
// WARRIOR_MAX_ATTACK
// WARRIOR_MIN_ATTACK
// WARRIOR_MAX_ATTACK
// WARRIOR_MIN_ATTACK
// WARRIOR_MAX_ATTACK

// --- Team Creation Function ---
const createTeam = (playerNumber) => ({
    characters: [
        new Character(playerNumber, "warrior", {
            HP: 100,
            Attack: 80,
            Defense: 80,
            MagicAttack: 20,
            MagicDefense: 20,
            Speed: 50,
            Luck: 35
        }, [{
            type: 'attack',
            scalar: SINGLE_TARGET_SCALAR,
            multiTarget: false
        }, {
            type: 'multi_attack',
            scalar: MULTI_TARGET_SCALAR,
            multiTarget: true
        }, {
            type: 'defend',
            scalar: 0,
            multiTarget: false
        }]),
        new Character(playerNumber, "mage", {
            HP: 100,
            Attack: 20,
            Defense: 20,
            MagicAttack: 80,
            MagicDefense: 80,
            Speed: 50,
            Luck: 35
        }, [{
            type: 'magic_attack',
            scalar: SINGLE_TARGET_SCALAR,
            multiTarget: false
        }, {
            type: 'multi_magic_attack',
            scalar: MULTI_TARGET_SCALAR,
            multiTarget: true
        }, {
            type: 'defend',
            scalar: 0,
            multiTarget: false
        }]),
        new Character(playerNumber, "priest", {
            HP: 75,
            Attack: 20,
            Defense: 80,
            MagicAttack: 20,
            MagicDefense: 80,
            Speed: 35,
            Luck: 35
        }, [{
            type: 'heal',
            scalar: HEAL_SCALAR,
            multiTarget: false
        }, {
            type: 'multi_heal',
            scalar: MULTI_HEAL_SCALAR,
            multiTarget: true
        }, {
            type: 'attack',
            scalar: SINGLE_TARGET_SCALAR,
            multiTarget: false
        }, {
            type: 'magic_attack',
            scalar: SINGLE_TARGET_SCALAR,
            multiTarget: false
        }, {
            type: 'defend',
            scalar: 0,
            multiTarget: false
        }]),
        new Character(playerNumber, "rogue", {
            HP: 50,
            Attack: 35,
            Defense: 35,
            MagicAttack: 35,
            MagicDefense: 35,
            Speed: 80,
            Luck: 80
        }, [{
            type: 'attack',
            scalar: SINGLE_TARGET_SCALAR,
            multiTarget: false
        }, {
            type: 'multi_attack',
            scalar: MULTI_TARGET_SCALAR,
            multiTarget: true
        }, {
            type: 'defend',
            scalar: 0,
            multiTarget: false
        }])
    ]
});

//Create players with AIPlayer methods
const team1 = new AIPlayer(1, createTeam(1).characters, 'optimal', 0.3);
const team2 = new AIPlayer(2, createTeam(2).characters, 'optimal', 0.3);

team1.characters.forEach(character => character.player = team1);
team2.characters.forEach(character => character.player = team2);

// // For a simulation *with* the AI director, pass in `new AI_Director()`
// // For a simulation *without* the AI director, pass in `null`
const game = new Game([team1, team2], new AI_Director('difficulty'), 1234, 20, 3);
game.runSimulation();

// Run repeated simulations
runRepeatedSimulations(1000, new AI_Director('difficulty'), 1234, 20, 3);