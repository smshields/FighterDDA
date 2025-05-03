const Constants = require('../../utils/Constants');
const Utils = require('../../utils/Utils');

/** Class showing the damage potential of an attack between an actor and target characters. */ 
class MagicAttackDamagePotential {
	
	/**
	 * Create an MagicAttackDamagePotential object. Used to hold information about the 
	 * highest possible damage output from a single-target magic attack action.
	 * @param {character} actor - the attacking character
	 * @param {character} target - the defending character
	 */
	constructor(actor, target){
		this.actor = actor;
		this.target = target;
		this.scalar = Constants.SINGLE_TARGET_SCALAR;

		//calculate damage potential
		this.damagePotential = Utils.mapMagicAttackStatToDamage(actor, target, this.scalar);
		this.killsTarget = this.damagePotential >= target.stats.currentHP;
	}
}

module.exports = MagicAttackDamagePotential;