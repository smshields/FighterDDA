const Logger = require('./Logger');
const TargetOutcomeLog = require('./TargetOutcomeLog');
const ActionTargetLog = require('./ActionTargetLog');

class CharacterActionOutcomeLog {

	constructor(action, timeStep) {
		this.timeStep = timeStep;

		this.controller = action.actor.playerNumber;
		this.characterName = action.actor.name;
		this.actionType = action.action.type;
		this.targets = [];

		for(let target of action.targets){
            this.targets.push(new ActionTargetLog(target.playerNumber, target.name));
        }

        this.defenseBoostReset = false;

        //for each target, need HP change or stat change, if it was defeated
        this.targetOutcomes = [];

	}

	/** Sets a boolean indicating if defense has been reset or not. 
	 * @param {bool} hasReset - indicates if defense was resetted with this action execution.
	 * */
	setDefenseBoostReset(hasReset = true){
		this.defenseBoostReset = hasReset;
	}

	addTargetOutcome(target, action, previousHP = null, previousDefense = null, previousMagicDefense = null){
		this.targetOutcomes.push(new TargetOutcomeLog(target, action, previousHP, previousDefense, previousMagicDefense))
	}

}

module.exports = CharacterActionOutcomeLog;