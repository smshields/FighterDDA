/**TODO - FEATURES:
 * - Automatically show class, method, involved variables on output
 * 
 * */

const InitialLog = require('./InitialLog');
const Constants = require('../utils/Constants');


class Logger {

	constructor() {

		//singleton for easy access
		if (Logger.instance) {
			return Logger.instance;
		}

		Logger.instance = this;

		//gameState for wrapping messaging
		this.gameState = {};
		//human readable log of game
		this.actionLog = [];
		//contains strings with warnings/errors
		this.errorLog = [];
		//captures initial game state/settings
		this.initialLog = new InitialLog();
		//captures game data at each time step
		this.timeStepLog = [];
		//captures end of game data
		//TODO: make class for this
		this.endLog = {};
	}

	logToConsole(message) {
		if (Constants.CONSOLE_LOGGING_ENABLED) {
			console.log(`TIMESTEP ${this.gameState.timeStep}: ` + message);
		}
	}

	//TODO: Should I have a warning method as well?
	logError(message) {
		this.logToConsole(message);
		let annotatedMessage = `TIMESTEP ${this.gameState.timeStep}: ` + message;
		this.errorLog.push(annotatedMessage);
		if (Constants.HALT_ON_ERROR) {
			throw new Error(`Halting due to detected error!`);
		}
	}

	logAction(message) {
		this.logToConsole(message);
		let annotatedMessage = `TIMESTEP ${this.gameState.timeStep}: ` + message;
		this.actionLog.push(annotatedMessage);

	}

	logTimeStep(timeStep) {
		this.timeStepLog.push(timeStep);
	}

	logEnd(endLog) {
		this.endLog = endLog;
	}
}

module.exports = Logger;