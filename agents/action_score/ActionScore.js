/**Class that contains utility score for an action.*/
class ActionScore {

	constructor(actionType, score, targets){
		this.actionType = actionType;
		this.score = score;
		this.targets = targets;
	}

	isValid(){
		return this.score >= 0 && this.targets && this.targets.length > 0;
	}
}

module.exports = ActionScore;