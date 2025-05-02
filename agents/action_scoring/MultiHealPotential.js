const Constants = require('../../utils/Constants');
const Utils = require('../../utils/Utils');

/** Class showing the healing potential actor and target characters. */
class MultiHealPotential {

	/**
	 * Create a MagicMultiAttackDamagePotential object. Used to hold information about the 
	 * highest possible damage output from a multi-target magic attack action.
	 * @param {Character} actor - the attacking character
	 * @param {Character[]} targets - the defending characters
	 */
	constructor(actor, targets) {
		this.actor = actor;
		this.targets = targets;
		this.scalar = Constants.MULTI_HEAL_SCALAR;
		this.numberOfKills = 0;
		this.totalDamagePotential = 0;


		//calculate damage potential
		this.healPotential = 0;
		this.totalLostHP = 0;
		this.totalCurrentHP = 0;
		this.totalMaxHP = 0;

		for (let target of targets) {
			this.healPotential += Utils.mapDefenseStatsToHeal(actor, this.scalar);
			this.totalLostHP += target.stats.HP - target.stats.currentHP;
			this.totalCurrentHP += target.stats.currentHP;
			this.totalMaxHP += target.stats.HP;
		}

		//calculate heal potential
		this.hpRatio = this.totalCurrentHP / this.totalMaxHP;
		this.overHeals = this.healPotential >= this.totalLostHP;
		this.overHealRatio = this.totalLostHP / this.healPotential;
	}
}

module.exports = MultiHealPotential;