const fs = require('fs');
const path = require('path');
const RNG = require('./utils/RNG');
const Utils = require('./utils/Utils');
const Constants = require('./utils/Constants');
const Character = require('./core/Character');
const AIPlayer = require('./agents/AIPlayer');
const AIDirector = require('./agents/AIDirector');
const Game = require('./core/Game');
const TeamFactory = require('./core/TeamFactory');


// New function to run repeated simulations
const runRepeatedSimulations = (numSimulations = 1, aiDirector = new AIDirector('difficulty'), seed = 1234, directorActionInterval = 3, actionExecutionInterval = 3) => {
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
        //fs.mkdirSync(simulationDirectory);

        // Create players with AIPlayer methods
        const team1 = new AIPlayer(1, teamFactory.createTeam(1).characters, 'optimal', 0.3);
        const team2 = new AIPlayer(2, teamFactory.createTeam(2).characters, 'optimal', 0.3);

        team1.characters.forEach(character => character.player = team1);
        team2.characters.forEach(character => character.player = team2);

        const game = new Game([team1, team2], aiDirector, directorActionInterval, actionExecutionInterval);
        //game.logDirectory = simulationDirectory; // Set the log directory
        game.runSimulation();
        console.log("Simulation Number: " + (i+1))

        const winner = game.checkGameOver();
        totalTimeSteps += game.gameState.timeStep;
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

const teamFactory = new TeamFactory();

const team1 = teamFactory.createTeam(1);
const team2 = teamFactory.createTeam(2);

//Create players with AIPlayer methods
const agent1 = new AIPlayer(1, team1.characters, 'optimal', 0.3);
const agent2 = new AIPlayer(2, team2.characters, 'optimal', 0.3);

//TODO: Fix circular reference...
agent1.characters.forEach(character => character.player = agent1);
agent2.characters.forEach(character => character.player = agent2);

// // For a simulation *with* the AI director, pass in `new AIDirector()`
// // For a simulation *without* the AI director, pass in `null`
//const game = new Game([agent1, agent2], new AIDirector('difficulty'), Constants.DIRECTOR_ACTION_INTERVAL, Constants.ACTION_EXECUTION_INTERVAL);
//game.runSimulation();

// Run repeated simulations
runRepeatedSimulations(100, new AIDirector('difficulty'), 1234, 20, 3);