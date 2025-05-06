class DirectorActionLog{
	
	constructor(action){
		this.controller = 'AI Director';
		this.playerTarget = action.playerNum;
		this.statsChanged = action.stats;
		this.baseAmount = actions.amount;


		/**
		 * TO IMPLEMENT:
		 * 
		 * Action Player Target
		 **/


	}

	toJSON(){}
}

module.exports = DirectorActionLog;