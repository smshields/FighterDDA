/**Class that contains utility score for an action.*/
class ActionScore {

	constructor(actionType, score){
		this.actionType = actionType;
		this.score = score;
	}

	isValid(){
		return this.score >= 0;
	}
}

module.exports = ActionScore;