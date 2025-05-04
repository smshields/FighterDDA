/** Combines an actionScore and action to enable action and target selection. */
class ChosenAction{
	
	constructor(actionScore, action){
		this.actionScore = actionScore;
		this.action = action;
	}
}

module.exports = ChosenAction;