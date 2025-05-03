const Constants = require('../../utils/Constants');
const Utils = require('../../utils/Utils');

/** Class showing the recovery potential of a healing action between an actor and target characters. */ 
class HealPotential {
	
	/**
	 * Create a HealPotential object. Used to hold information about the 
	 * highest heal output from a single-target heal action.
	 * @param {character} actor - the character performing the heal
	 * @param {character} target - the character receiving the heal
	 */
	constructor(actor, target){
		this.actor = actor;
		this.target = target;
		this.scalar = Constants.HEAL_SCALAR;

		//calculate heal potential
		this.hpRatio = target.stats.currentHP / target.stats.HP;
		this.healPotential = Utils.mapDefenseStatsToHeal(actor, this.scalar);
		this.lostHP = target.stats.HP - target.stats.currentHP;
		this.overHeals = this.healPotential >= this.lostHP;
		this.overHealRatio = this.lostHP / this.healPotential;
	}
}

module.exports = HealPotential;