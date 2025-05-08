class DirectorTargetOutcomeLog {
	
	constructor(target, action){
		//action/target details
		this.controller = target.playerNumber;
		this.characterName = target.name;

		this.previousStats = {};
		this.newStats = {};

		for(let stat of action.statsChanged){
			previousStats[stat] = target.stats[stat] - action.statChange;
			newStats[stat] = target.stats[stat];
		}
	}

}

module.exports = DirectorTargetOutcomeLog;