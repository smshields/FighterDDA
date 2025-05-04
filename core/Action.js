/** Contains all information needed for performing an action.
 * TODO - REFACTOR:
 * - Put type as top-level attribute (?)
 * */
class Action{

	constructor(actor, action, targets, timeStepQueued){
		this.actor = actor;
		this.action = action;
		this.targets = targets;
		this.timeStepQueued = timeStepQueued;
	}
	
}

module.exports = Action;