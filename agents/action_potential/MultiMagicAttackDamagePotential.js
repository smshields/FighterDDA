const Constants = require('../../utils/Constants');
const Utils = require('../../utils/Utils');

/** Class showing the damage potential of an attack between an actor and target characters. */ 
class MultiMagicAttackDamagePotential {
	
	/**
	 * Create a MagicMultiAttackDamagePotential object. Used to hold information about the 
	 * highest possible damage output from a multi-target magic attack action.
	 * @param {Character} actor - the attacking character
	 * @param {Character[]} targets - the defending characters
	 */
	constructor(actor, targets){
		this.actor = actor;
		this.targets = targets;
		this.scalar = Constants.MULTI_TARGET_SCALAR;
		this.numberOfKills = 0;
		this.totalDamagePotential = 0;
		
		//calculate damage potential
		let totalDamagePotential = 0;
		let damage = 0;
		for(let target of targets){
			damage = Utils.mapMagicAttackStatToDamage(actor, target, this.scalar);
			if(damage >= target.stats.currentHP){
				this.numberOfKills++;
			}
			this.totalDamagePotential += damage;
		}
	}
}

module.exports = MultiMagicAttackDamagePotential;