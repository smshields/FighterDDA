/** Contains all information needed for performing a director action
 * 
 * TODO - FEATURES:
 * - Make it so character buffs are unique and track appropriately (will probably need new object) 
 * - Make an inherited class to handle environment actions
 * */

let Constants = require('../utils/Constants');

class DirectorAction{

	constructor(type, playerTarget, characterTargets, stats, statChange){
		this.actor = "AI Director";
		this.type = type;
		this.playerTarget = playerTarget;
		this.characterTargets = characterTargets;
		this.stats = stats;
		this.statChange = statChange * Constants.DIRECTOR_CHANGE_SCALAR;
	}
}

module.exports = DirectorAction;