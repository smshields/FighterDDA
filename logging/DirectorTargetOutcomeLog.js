class DirectorTargetOutcomeLog {
	
	constructor(target, action){
		//action/target details
		this.controller = target.playerNumber;
		this.characterName = target.name;

		this.previousStats = {};
		this.newStats = {};

		for(let stat of action.stats){
			this.previousStats[stat] = target.stats[stat] - action.statChange;
			this.newStats[stat] = target.stats[stat];
		}
	}

}

module.exports = DirectorTargetOutcomeLog;