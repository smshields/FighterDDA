/**TODO - FEATURES:
 * - Automatically show class, method, involved variables on output
 * 
 * */

const fs = require('node:fs');
const path = require('node:path');

const InitialLog = require('./InitialLog');
const EndLog = require('./EndLog');
const Constants = require('../utils/Constants');


class Logger {

    constructor() {
        //singleton for easy access
        if (Logger.instance) {
            return Logger.instance;
        } else {
            Logger.instance = this;
        }

        this.outputDirectory = "";


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

    writeLogToFile() {

        const filePath = path.join(this.outputDirectory, `${Constants.RNG_SEED}.json`);
        const outputLog = this.completeLogToJSONString();

        try {
            fs.writeFileSync(filePath, outputLog);
        } catch (err) {
            this.logError("Logger - writeLogToFile: Issue writing file! " + err);
        }
    }

    completeLogToJSONString() {

        let timeStepLogs = [];
        for (let log of this.timeStepLog) {
            timeStepLogs.push(log.toJSON());
        }

        let completeLog = {
            "initialLog": this.initialLog.toJSON(),
            "timeStepLogs": timeStepLogs,
            "endLog": this.endLog.toJSON()
        };

        return JSON.stringify(completeLog, (key, value) => {
            if (value !== null) return value
        }, 2);
    }

    deleteSingletonInstance() {
        Logger.instance = null;
    }


}

module.exports = Logger;