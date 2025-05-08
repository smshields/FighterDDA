const DirectorTargetOutcomeLog = require('./DirectorTargetOutcomeLog');


class DirectorActionOutcomeLog{
	
	constructor(action, timeStep){
		this.timeStep = timeStep;
		this.controller = 'AI Director';
		this.playerTarget = action.playerTarget;
		this.statsChanged = action.stats;
		this.statChange = action.statChange;
		this.targets = [];

		for(let character of action.characterTargets){
			this.targets.push(new DirectorTargetOutcomeLog(action, character));
		}
	}
}

module.exports = DirectorActionOutcomeLog;